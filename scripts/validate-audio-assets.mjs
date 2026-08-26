import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', 'public', 'assets', 'audio');
const manifest = JSON.parse(readFileSync(join(root, 'audio-manifest.json'), 'utf8'));
const expectedFiles = new Set([
  'music/game-of-discoveries.mp3',
  'music/garden-gate.mp3',
  'music/letters-garden.mp3',
  'music/painted-garden-gate.mp3',
  'music/sunlight-on-the-bookshelf.mp3',
  'music/polygons-at-play.mp3'
]);

function assert(condition, message) {
  if (!condition) throw new Error(`Audio validation failed: ${message}`);
}

assert(manifest.version === 2, 'unexpected manifest version');
assert(manifest.assets?.length === expectedFiles.size, 'expected six configured music tracks');
const seen = new Set();
for (const asset of manifest.assets) {
  assert(!seen.has(asset.id), `duplicate id ${asset.id}`);
  seen.add(asset.id);
  assert(expectedFiles.has(asset.file), `unexpected or missing file ${asset.file}`);
  assert(asset.durationSeconds > 0, `invalid duration for ${asset.id}`);
  const file = join(root, ...asset.file.split('/'));
  const header = readFileSync(file).subarray(0, 3);
  const isMp3 = header.toString('ascii') === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  assert(isMp3, `${asset.file} is not MP3`);
  assert(statSync(file).size > 100_000, `${asset.file} is unexpectedly small`);
}
assert(seen.size === expectedFiles.size, 'not all configured tracks are represented');
console.log('Validated the format and manifest mapping of 6 MP3 music tracks; this is not a rights approval.');
