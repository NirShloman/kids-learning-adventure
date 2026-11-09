import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const failures = [];
const roots = ['src'];
const banned = [
  [/\b(firebase|segment|mixpanel|amplitude|google-analytics|sentry)\b/i, 'analytics or remote SDK'],
  [/\b(getUserMedia|mediaDevices|enumerateDevices)\b/, 'camera or microphone API'],
  [/\b(deviceId|advertisingId|identifierForVendor)\b/i, 'device identifier'],
  [/\b(sendBeacon|XMLHttpRequest)\b/, 'outbound transport'],
  [/fetch\s*\(/, 'runtime fetch']
];

function visit(path) {
  for (const name of readdirSync(path)) {
    const file = join(path, name);
    if (statSync(file).isDirectory()) { visit(file); continue; }
    // Explicitly isolated, optional Web pilot. Native/local runtime is still checked below.
    if (relative('.', file).replaceAll('\\', '/').startsWith('src/pilot/')) continue;
    if (!/\.(?:ts|tsx|js|jsx)$/.test(name)) continue;
    const source = readFileSync(file, 'utf8');
    for (const [pattern, label] of banned) if (pattern.test(source)) failures.push(`${relative('.', file)}: ${label}`);
    for (const match of source.matchAll(/https?:\/\/[^'"`\s)]+/g)) failures.push(`${relative('.', file)}: external URL ${match[0]}`);
  }
}
roots.forEach(visit);

// Cloud SDKs and outbound transport may occur only inside the pilot boundary.
const pilotCloud = readFileSync('src/pilot/cloud.ts', 'utf8');
for (const match of pilotCloud.matchAll(/from ['"]([^'"]+)['"]/g)) {
  if (!['firebase/app','firebase/auth','firebase/firestore','firebase/functions','./model'].includes(match[1])) failures.push('src/pilot/cloud.ts: unexpected cloud dependency');
}
for (const name of readdirSync('src/pilot').filter(name=>/\.tsx?$/.test(name))) {
  const file=`src/pilot/${name}`;
  const source = readFileSync(file, 'utf8');
  if (/\b(sendBeacon|XMLHttpRequest|getUserMedia|mediaDevices|segment|mixpanel|amplitude|sentry)\b/.test(source)) failures.push(`${file}: forbidden telemetry or device API`);
  if (/https:\/\//.test(source)) failures.push(`${file}: hardcoded external endpoint`);
  if (/\bfetch\s*\(|\bXMLHttpRequest\b/.test(source)) failures.push(`${file}: direct outbound transport outside approved SDK`);
  if (file !== 'src/pilot/cloud.ts' && /from ['"](?:firebase|@firebase)\//.test(source)) failures.push(`${file}: SDK import outside cloud adapter`);
}

const worker = readFileSync('public/sw.js', 'utf8');
if (!worker.includes('isSameOriginRequest')) failures.push('public/sw.js: missing same-origin request guard');
if (failures.length) { console.error(`Local-privacy validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`); process.exit(1); }
console.log('Validated local/native privacy boundary and optional pilot SDK boundary: no analytics, device IDs, camera or microphone APIs.');
