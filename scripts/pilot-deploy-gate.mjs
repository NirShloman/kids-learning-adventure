import { loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
if (env.VITE_PILOT_ENABLED === '1') {
  await import('./pilot-readiness.mjs');
  const config=JSON.parse(readFileSync('pilot/readiness.json','utf8'));
  if (!process.exitCode && env.VITE_PILOT_PROJECT_ID !== config.deployment.pilotProjectId) throw new Error('Firebase project differs from the reviewed pilot deployment');
}
