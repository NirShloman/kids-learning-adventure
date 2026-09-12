import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifestPath = join(root, 'src', 'assets', 'generatedNarrationManifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  schemaVersion?: number;
  entries?: Record<string, { assetKey?: string; localPath?: string; checksum?: string; storagePath?: string }>;
};
const errors: string[] = [];
if (manifest.schemaVersion !== 1 || !manifest.entries || typeof manifest.entries !== 'object') {
  errors.push('generated narration manifest must use schemaVersion 1 and contain entries');
}
for (const [text, entry] of Object.entries(manifest.entries ?? {})) {
  if (!text.trim()) errors.push('manifest contains an empty narration key');
  if (!/^[a-f0-9]{64}$/.test(entry.assetKey ?? '')) errors.push(`${text}: invalid assetKey`);
  if (!entry.localPath?.startsWith('/assets/audio/narration/')) errors.push(`${text}: invalid localPath`);
  if (!entry.storagePath?.startsWith('narration/')) errors.push(`${text}: invalid storagePath`);
  const filePath = join(root, 'public', entry.localPath?.replace(/^\//, '') ?? 'missing');
  if (!existsSync(filePath)) { errors.push(`${text}: missing local MP3`); continue; }
  const checksum = createHash('sha256').update(readFileSync(filePath)).digest('hex');
  if (checksum !== entry.checksum) errors.push(`${text}: checksum mismatch`);
}

if (process.argv.includes('--strict')) {
  const catalogPath = join(root, 'tmp', 'narration', 'catalog.json');
  if (!existsSync(catalogPath)) errors.push('strict validation requires npm run narration:catalog first');
  else {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as { entries: Array<{ sourceText: string }> };
    const missing = [...new Set(catalog.entries.map((entry) => entry.sourceText))]
      .filter((text) => !manifest.entries?.[text]);
    if (missing.length) errors.push(`${missing.length} unique catalog texts do not have ready local narration`);
  }
}

if (errors.length) {
  console.error(`Generated narration validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  process.exit(1);
}
console.log(`Validated ${Object.keys(manifest.entries ?? {}).length} generated narration assets${process.argv.includes('--strict') ? ' with strict catalog coverage' : ''}.`);
