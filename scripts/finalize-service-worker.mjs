import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = 'dist';
const workerPath = join(dist, 'sw.js');
const assets = ['/', '/index.html', '/manifest.webmanifest'];
function visit(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name); const stat = statSync(path);
    if (stat.isDirectory()) { visit(path); continue; }
    const url = `/${relative(dist, path).split(sep).join('/')}`;
    if (/\.(?:js|css|woff2?|json|svg)$/.test(name) && stat.size < 2_000_000 && url !== '/sw.js') assets.push(url);
  }
}
visit(dist);
const source = readFileSync(workerPath, 'utf8')
  .replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = 'yedale-v1.3.0-${Date.now()}';`)
  .replace(/const STATIC_ASSETS = \[[\s\S]*?\];/, `const STATIC_ASSETS = ${JSON.stringify([...new Set(assets)].sort(), null, 2)};`);
writeFileSync(workerPath, source, 'utf8');
console.log(`Prepared service worker with ${new Set(assets).size} same-origin app-shell assets.`);
