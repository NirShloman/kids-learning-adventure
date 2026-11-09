import { build } from 'esbuild';
await build({ entryPoints: ['src/index.ts'], outfile: 'lib/index.js', platform: 'node', target: 'node22', format: 'esm', bundle: true, external: ['firebase-admin/*', 'firebase-functions/*', 'zod'], sourcemap: true });
