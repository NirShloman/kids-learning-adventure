import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const contentDirectory = join(root, 'src', 'content');

for (const fileName of readdirSync(contentDirectory).filter((name) => name.endsWith('.json') && name !== 'content-envelope.schema.json')) {
  const filePath = join(contentDirectory, fileName);
  const value = JSON.parse(readFileSync(filePath, 'utf8'));
  for (const item of value.items ?? []) {
    const narration = item.audioText;
    if (typeof narration !== 'string') continue;
    if (/[A-Za-z]/.test(narration)) failures.push(`${fileName}:${item.id} contains Latin characters`);
    if (!/[\u0590-\u05FF]/.test(narration)) failures.push(`${fileName}:${item.id} has no Hebrew narration`);
    if (narration.length > 260) failures.push(`${fileName}:${item.id} narration is longer than 260 characters`);
  }
}

const sourceFiles = [
  join(root, 'src', 'data', 'gameInstructions.ts'),
  ...readdirSync(join(root, 'src', 'components', 'games'), { recursive: true })
    .filter((name) => typeof name === 'string' && name.endsWith('.tsx'))
    .map((name) => join(root, 'src', 'components', 'games', name))
];

for (const filePath of sourceFiles) {
  const source = readFileSync(filePath, 'utf8');
  for (const match of source.matchAll(/\bspeak\(\s*(['"`])([\s\S]*?)\1/g)) {
    const spokenText = match[2].replace(/\$\{[\s\S]*?\}/g, '');
    if (/[A-Za-z]/.test(spokenText)) failures.push(`${filePath.replace(root, '')} contains Latin text in speak()`);
  }
}

if (failures.length) {
  console.error(`Hebrew narration validation failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log('Hebrew narration validation passed.');
