import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return listSourceFiles(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry) ? [path] : [];
  });
}

test('does not use unsafe HTML/eval APIs in source or scripts', async () => {
  const files = [...listSourceFiles('src'), ...listSourceFiles('scripts')];
  const matches = files.flatMap((file) => {
    const content = readFileSync(file, 'utf8');
    return [/dangerouslySetInnerHTML/, /\.innerHTML\b/, /eval\(/].flatMap((pattern) =>
      pattern.test(content) ? [`${file}: ${pattern}`] : []
    );
  });

  expect(matches).toEqual([]);
});
