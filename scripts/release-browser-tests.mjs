import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('dist/index.html')) throw new Error('Build the release before running its browser checks.');
const result = spawnSync(process.execPath, [
  'node_modules/@playwright/test/cli.js', 'test',
  'tests/e2e/smoke.local.spec.ts', 'tests/e2e/storage-recovery.local.spec.ts',
  '--project=local-chromium', '--project=mobile-chrome'
], {
  stdio: 'inherit',
  env: { ...process.env, E2E_PREVIEW: '1', E2E_BASE_URL: 'http://127.0.0.1:4179', CI: '1' }
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
