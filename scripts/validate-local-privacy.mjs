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
    if (!/\.(?:ts|tsx|js|jsx)$/.test(name)) continue;
    const source = readFileSync(file, 'utf8');
    for (const [pattern, label] of banned) if (pattern.test(source)) failures.push(`${relative('.', file)}: ${label}`);
    for (const match of source.matchAll(/https?:\/\/[^'"`\s)]+/g)) failures.push(`${relative('.', file)}: external URL ${match[0]}`);
  }
}
roots.forEach(visit);

const worker = readFileSync('public/sw.js', 'utf8');
if (!worker.includes('isSameOriginRequest')) failures.push('public/sw.js: missing same-origin request guard');
if (failures.length) { console.error(`Local-privacy validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`); process.exit(1); }
console.log('Validated local-only runtime: no analytics, external transport, device IDs, camera, or microphone APIs.');
