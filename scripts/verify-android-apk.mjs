import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';

const apk = resolve(process.argv[2] ?? 'android/app/build/outputs/apk/debug/app-debug.apk');
const sdk = process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME;
if (!sdk) throw new Error('Set ANDROID_SDK_ROOT to inspect the built APK.');
const windows = process.platform === 'win32';
const tools = resolve(sdk, 'build-tools', '36.0.0');
function run(name, args) {
  const executable = resolve(tools, name + (windows ? name === 'apksigner' ? '.bat' : '.exe' : ''));
  const result = spawnSync(executable, args, { encoding: 'utf8', shell: windows && name === 'apksigner' });
  if (result.status !== 0) throw new Error(`${name} failed: ${result.stderr || result.error?.message || result.stdout}`);
  return result.stdout;
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const permissions = run('aapt', ['dump', 'permissions', apk]);
const declaredPermissions = [...permissions.matchAll(/uses-permission: name='([^']+)'/g)].map(match => match[1]);
const receiverPermission = 'com.nirshloman.lomdimbekef.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION';
if (declaredPermissions.some(name => name !== receiverPermission)) throw new Error(`Unexpected permissions in the merged APK:\n${permissions}`);
if (declaredPermissions.includes(receiverPermission)) {
  const manifest = run('aapt', ['dump', 'xmltree', apk, 'AndroidManifest.xml']);
  const declaration = manifest.split(/\n\s*E: /).find(block => block.startsWith('permission ') && block.includes(receiverPermission));
  if (!declaration || !/android:protectionLevel[^\n]*=\(type 0x11\)0x2\s/.test(declaration)) {
    throw new Error('The AndroidX private receiver permission must have signature protection.');
  }
}
const badging = run('aapt', ['dump', 'badging', apk]);
if (!badging.includes("name='com.nirshloman.lomdimbekef'") || !badging.includes("targetSdkVersion:'36'") || !badging.includes("sdkVersion:'28'")) {
  throw new Error('APK identity or SDK levels differ from the release contract.');
}
run('apksigner', ['verify', apk]);

// APKs are ordinary non-ZIP64 archives. Read their directory without extracting
// files, so verification cannot write attacker-controlled archive paths.
const bytes = readFileSync(apk);
let end = bytes.length - 22;
for (; end >= Math.max(0, bytes.length - 65557); end--) if (bytes.readUInt32LE(end) === 0x06054b50) break;
if (end < Math.max(0, bytes.length - 65557)) throw new Error('Invalid APK ZIP directory');
let offset = bytes.readUInt32LE(end + 16);
const count = bytes.readUInt16LE(end + 10);
if (offset === 0xffffffff || count === 0xffff) throw new Error('ZIP64 requires separate APK Analyzer review');
const entries = new Map();
for (let index = 0; index < count; index++) {
  if (bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid APK entry');
  const length = bytes.readUInt16LE(offset + 28);
  const name = bytes.subarray(offset + 46, offset + 46 + length).toString('utf8');
  if (entries.has(name)) throw new Error(`Duplicate APK path: ${name}`);
  entries.set(name, { method: bytes.readUInt16LE(offset + 10), size: bytes.readUInt32LE(offset + 20), offset: bytes.readUInt32LE(offset + 42) });
  offset += 46 + length + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
}
function content(entry) {
  const start = entry.offset + 30 + bytes.readUInt16LE(entry.offset + 26) + bytes.readUInt16LE(entry.offset + 28);
  const data = bytes.subarray(start, start + entry.size);
  if (entry.method === 0) return data;
  if (entry.method === 8) return inflateRawSync(data);
  throw new Error('Unsupported APK compression');
}
const dist = resolve('dist');
const expected = new Set();
function verify(directory) {
  for (const name of readdirSync(directory)) {
    const path = resolve(directory, name);
    if (statSync(path).isDirectory()) { verify(path); continue; }
    const key = `assets/public/${relative(dist, path).split(sep).join('/')}`;
    const entry = entries.get(key);
    if (!entry || digest(content(entry)) !== digest(readFileSync(path))) throw new Error(`APK does not contain the current production file: ${key}`);
    expected.add(key);
  }
}
if (!existsSync(dist)) throw new Error('Build production web assets before checking the APK');
verify(dist);
for (const name of entries.keys()) {
  if (!name.startsWith('assets/public/') || name.endsWith('/') || expected.has(name)) continue;
  // Capacitor sync creates these empty compatibility files without Cordova plugins.
  if (['assets/public/cordova.js', 'assets/public/cordova_plugins.js'].includes(name) && content(entries.get(name)).length === 0) continue;
  throw new Error(`Stale or unexpected APK asset: ${name}`);
}
const libraries = [...entries.keys()].filter(name => name.endsWith('.so'));
if (libraries.length) throw new Error(`Native ELF libraries require a 16 KB alignment check: ${libraries.join(', ')}`);
run('zipalign', ['-c', '-P', '16', '4', apk]);
mkdirSync('reports', { recursive: true });
writeFileSync('reports/android-apk-verification.json', JSON.stringify({
  apk, sha256: digest(bytes), bytes: bytes.length,
  debuggable: badging.includes('application-debuggable'),
  productionAssetsCompared: expected.size, permissions: declaredPermissions, runtimePermissions: [], nativeElfLibraries: libraries,
  signed: true, zipAlignment: 'pass', physicalDeviceTest: 'not performed'
}, null, 2));
console.log(`APK verified: ${expected.size} current production assets, no runtime permissions or ELF libraries, valid signature and ZIP alignment.`);
