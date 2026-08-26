import { existsSync } from 'node:fs';
import { fixedNarrationEntries } from '../src/assets/narrationManifest';

const errors: string[] = [];
const ids = new Set<string>();
for (const entry of fixedNarrationEntries) {
  if (ids.has(entry.id)) errors.push(`duplicate narration id: ${entry.id}`);
  ids.add(entry.id);
  if (!/^[a-z0-9.-]+$/.test(entry.id)) errors.push(`unstable narration id format: ${entry.id}`);
  if (!/[\u0590-\u05FF]/.test(entry.text) || /[A-Za-z]/.test(entry.text)) errors.push(`${entry.id}: narration must be Hebrew-only`);
  if (entry.recordedPath && !existsSync(`public${entry.recordedPath}`)) errors.push(`${entry.id}: missing recorded file ${entry.recordedPath}`);
  if (entry.recordedPath && (!entry.checksum || !entry.durationMs)) errors.push(`${entry.id}: recorded file requires checksum and duration`);
}
if (errors.length) { console.error(`Narration manifest validation failed:\n${errors.join('\n')}`); process.exit(1); }
console.log(`Validated ${fixedNarrationEntries.length} stable narration entries; missing human recordings use local speech fallback.`);
