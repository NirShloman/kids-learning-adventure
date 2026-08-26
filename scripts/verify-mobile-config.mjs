import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const required = [
  'capacitor.config.ts',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/build.gradle',
  'ios/App/App/Info.plist',
  'ios/App/App.xcodeproj/project.pbxproj',
  'public/privacy.html',
  'public/icons/icon-512.png',
  'public/assets/audio/audio-manifest.json',
  'public/assets/video/learning-garden-welcome.mp4',
  'public/assets/video/learning-garden-welcome.poster.webp',
  'public/assets/video/learning-garden-lobby.mp4',
  'public/assets/video/learning-garden-lobby.poster.webp',
  'public/assets/video/counting-orchard.mp4',
  'public/assets/video/counting-orchard.poster.webp'
];

for (const relative of required) {
  try { await access(path.join(root, relative)); }
  catch { failures.push(`Missing ${relative}`); }
}

async function text(relative) { return readFile(path.join(root, relative), 'utf8'); }
const capacitor = await text('capacitor.config.ts');
if (!capacitor.includes("appId: 'com.nirshloman.lomdimbekef'")) failures.push('Unexpected Capacitor appId');
if (/server\s*:\s*{[^}]*url\s*:/s.test(capacitor)) failures.push('Capacitor server.url must not be configured');

const androidManifest = await text('android/app/src/main/AndroidManifest.xml');
for (const permission of ['INTERNET', 'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'AD_ID']) {
  if (androidManifest.includes(`android.permission.${permission}`)) failures.push(`Forbidden Android permission: ${permission}`);
}
if (!androidManifest.includes('android:allowBackup="false"')) failures.push('Android backup must be disabled');
if (!androidManifest.includes('android:usesCleartextTraffic="false"')) failures.push('Android cleartext traffic must be disabled');

const variables = await text('android/variables.gradle');
if (!variables.includes('minSdkVersion = 28')) failures.push('Android minSdk must be 28');
if (!variables.includes('targetSdkVersion = 36')) failures.push('Android targetSdk must be 36');

const project = await text('ios/App/App.xcodeproj/project.pbxproj');
if (project.includes('IPHONEOS_DEPLOYMENT_TARGET = 15.0')) failures.push('iOS deployment target is still 15');
if (!project.includes('IPHONEOS_DEPLOYMENT_TARGET = 16.0')) failures.push('iOS deployment target must be 16');
if (!project.includes('MARKETING_VERSION = 1.2.0')) failures.push('iOS marketing version must be 1.2.0');

for (const relative of required.filter((item) => item.endsWith('.mp4'))) {
  const data = await readFile(path.join(root, relative));
  if (!data.subarray(4, 12).toString('ascii').includes('ftyp')) failures.push(`${relative} is not an ISO MP4`);
  if (!data.includes(Buffer.from('avc1'))) failures.push(`${relative} must use store-compatible H.264 video`);
  if (!data.includes(Buffer.from('mp4a'))) failures.push(`${relative} must use store-compatible AAC audio`);
  if ((await stat(path.join(root, relative))).size > 25 * 1024 * 1024) failures.push(`${relative} exceeds 25 MB`);
}

for (const relative of required.filter((item) => item.endsWith('.webp'))) {
  const data = await readFile(path.join(root, relative));
  if (data.subarray(0, 4).toString('ascii') !== 'RIFF' || data.subarray(8, 12).toString('ascii') !== 'WEBP') {
    failures.push(`${relative} is not a WebP image`);
  }
}

const packageJson = JSON.parse(await text('package.json'));
if (packageJson.version !== '1.2.0') failures.push('package.json version must be 1.2.0');
for (const [name, version] of Object.entries(packageJson.dependencies)) {
  if (name.startsWith('@capacitor/') && !/^8\./.test(version)) failures.push(`${name} is not pinned to Capacitor 8`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log('Mobile configuration, privacy, permissions, versions, and bundled media verified.');
