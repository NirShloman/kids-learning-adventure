import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const problems = [];
const readiness = json('docs/release/store-readiness.json');
const media = json('docs/release/media-approvals.json');
const metadata = json('docs/store-metadata.json');
const pkg = json('package.json');
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory).sort()) {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
}
for (const directory of ['src', 'public', 'android/app/src/main', 'scripts', '.github/workflows', 'fastlane']) walk(resolve(root, directory));
for (const path of ['package.json', 'package-lock.json', 'docs/store-metadata.json', 'capacitor.config.ts', 'vite.config.ts', 'android/app/build.gradle', 'android/variables.gradle', 'android/build.gradle']) files.push(resolve(root, path));
const inputs = files.sort().map(path => ({ path: relative(root, path).split(sep).join('/'), sha256: hash(readFileSync(path)) }));
const fingerprint = hash(JSON.stringify(inputs));

function evidenceValid(record) {
  if (!record || !record.evidencePath || !/^[a-f0-9]{64}$/.test(record.evidenceSha256 ?? '')) return false;
  const path = resolve(root, record.evidencePath);
  // Accept evidence files inside this repository, not arbitrary host files.
  const rel = relative(root, path);
  return !isAbsolute(rel) && !rel.startsWith('..') && !rel.startsWith(sep) && existsSync(path) && statSync(path).isFile() && hash(readFileSync(path)) === record.evidenceSha256;
}

if (readiness.schemaVersion !== 1 || media.schemaVersion !== 1) problems.push('Unsupported readiness schema');
for (const key of ['legalName', 'developerName', 'privacyEmail', 'supportEmail', 'postalAddress', 'privacyUrl', 'supportUrl']) {
  const value = readiness.operator?.[key];
  if (typeof value !== 'string' || !value.trim()) problems.push(`Missing operator.${key}`);
}
for (const key of ['privacyEmail', 'supportEmail']) {
  if (readiness.operator?.[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(readiness.operator[key])) problems.push(`Invalid operator.${key}`);
}
for (const path of ['privacy.html', 'support.html', 'terms.html', 'copyright.html', 'licenses.html']) {
  const text = readFileSync(resolve(root, 'public', path), 'utf8');
  if (/class="placeholder"|\[יש להשלים|\[legal name|\[email required|\[address required/.test(text)) problems.push(`${path}: unresolved publication placeholders`);
  if (/BLOCKED_UNVERIFIED|טיוטת תנאי שימוש|תיק הזכויות[^<]*טרם הושלם/.test(text)) problems.push(`${path}: unresolved pre-release status`);
}
const policy = readFileSync(resolve(root, 'public/privacy.html'), 'utf8');
for (const key of ['legalName', 'privacyEmail']) {
  if (readiness.operator?.[key] && !policy.includes(readiness.operator[key])) problems.push(`privacy.html does not match operator.${key}`);
}
if (metadata.displayName !== 'עולמיה' || metadata.latinName !== 'Olamia' || metadata.version !== pkg.version) problems.push('Store branding/version differs from the application');
if (readiness.inputFingerprint !== fingerprint) problems.push('Manual approvals do not match the current release inputs');
for (const key of ['androidDevices', 'educationalReview', 'childUsability', 'playConsoleDeclarations', 'brandClearance']) {
  if (!evidenceValid(readiness.approvals?.[key])) problems.push(`Missing or changed approval evidence: ${key}`);
}

const approvedHashes = new Set();
for (const approval of media.approvals ?? []) {
  if (!evidenceValid(approval) || approval.commercialDistribution !== true) {
    problems.push('Media approval has missing/changed evidence or no commercial distribution permission');
    continue;
  }
  for (const value of approval.assetHashes ?? []) {
    if (/^[a-f0-9]{64}$/.test(value)) approvedHashes.add(value);
    else problems.push('Media approval contains an invalid asset hash');
  }
}
const packagedMedia = inputs.filter(file => file.path.startsWith('public/') && /\.(?:png|webp|jpg|jpeg|mp3|mp4|wav|ogg|riv)$/i.test(file.path));
const missingMedia = packagedMedia.filter(file => !approvedHashes.has(file.sha256));
if (missingMedia.length) problems.push(`${missingMedia.length} packaged media files lack approved evidence`);

if (process.argv.includes('--online')) {
  for (const key of ['privacyUrl', 'supportUrl']) {
    const address = readiness.operator?.[key];
    if (!address) continue;
    try {
      const url = new URL(address);
      if (url.protocol !== 'https:') throw new Error('HTTPS required');
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const body = await response.text();
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Public HTML page unavailable');
      if (!body.includes(readiness.operator.legalName) || !body.includes(readiness.operator.privacyEmail)) throw new Error('Published identity does not match');
      if (/\[יש להשלים|\[legal name required|class="placeholder"/.test(body)) throw new Error('Public page still contains placeholders');
    } catch (error) { problems.push(`${key}: ${error.message}`); }
  }
}
mkdirSync(resolve(root, 'reports'), { recursive: true });
const output = resolve(root, 'reports/store-readiness.json');
writeFileSync(output, JSON.stringify({ inputFingerprint: fingerprint, ready: problems.length === 0, problems, packagedMedia, missingMedia }, null, 2));
console.log(`Store readiness: ${problems.length ? 'BLOCKED' : 'PASS'}; ${packagedMedia.length} packaged media files; ${missingMedia.length} missing approvals.`);
for (const problem of problems) console.log(`- ${problem}`);
console.log(`Evidence inventory: ${output}`);
process.exitCode = problems.length ? 1 : 0;
