import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const viteCli = join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const env = {
  ...process.env,
  HOST: '127.0.0.1'
};

const child = spawn(process.execPath, [viteCli, '--host', '127.0.0.1'], {
  cwd: rootDir,
  env,
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
