import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const viteCli = join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const useFirebase = process.env.E2E_USE_FIREBASE === '1';

const env = {
  ...process.env,
  HOST: '127.0.0.1'
};

if (useFirebase) {
  env.VITE_E2E_USE_FIREBASE_EMULATOR = '1';
  env.VITE_FIREBASE_API_KEY ||= 'e2e-api-key';
  env.VITE_FIREBASE_AUTH_DOMAIN ||= 'demo-kids-learning-e2e.firebaseapp.com';
  env.VITE_FIREBASE_PROJECT_ID ||= 'demo-kids-learning-e2e';
  env.VITE_FIREBASE_STORAGE_BUCKET ||= 'demo-kids-learning-e2e.appspot.com';
  env.VITE_FIREBASE_MESSAGING_SENDER_ID ||= '1234567890';
  env.VITE_FIREBASE_APP_ID ||= '1:1234567890:web:e2e';
  env.VITE_FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
  env.VITE_FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
} else {
  env.VITE_E2E_DISABLE_FIREBASE = '1';
}

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
