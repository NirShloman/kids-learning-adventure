import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const playwrightCli = join(rootDir, 'node_modules', '@playwright', 'test', 'cli.js');

const env = {
  ...process.env,
  E2E_USE_FIREBASE: '1',
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099',
  VITE_E2E_USE_FIREBASE_EMULATOR: '1',
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || 'e2e-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-kids-learning-e2e.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-kids-learning-e2e',
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-kids-learning-e2e.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:e2e',
  VITE_FIRESTORE_EMULATOR_HOST: process.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',
  VITE_FIREBASE_AUTH_EMULATOR_HOST: process.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
};

const args = ['test', '--project=firebase-emulator', ...process.argv.slice(2)];
const child = spawn(process.execPath, [playwrightCli, ...args], {
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
