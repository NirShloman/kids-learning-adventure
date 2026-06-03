import { config as loadEnv } from 'dotenv';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

loadEnv({ path: '.env', quiet: true });
loadEnv({ path: '.env.local', override: true, quiet: true });

function getCredential() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) return applicationDefault();
  if (!existsSync(serviceAccountPath)) throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH does not exist: ${serviceAccountPath}`);

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  return cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key
  });
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Missing FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID.');

  const app = getApps()[0] ?? initializeApp({ credential: getCredential(), projectId });
  const db = getFirestore(app);
  const snapshot = await db.collection('questions').where('status', '==', 'approved').get();
  const questions = snapshot.docs.map((doc) => doc.data());
  const exportedAt = new Date().toISOString();

  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/firebase-questions-export.json', `${JSON.stringify({
    exportedAt,
    projectId,
    count: questions.length,
    questions
  }, null, 2)}\n`, 'utf8');

  console.log(`Exported ${questions.length} approved questions to reports/firebase-questions-export.json.`);
}

main().catch((error) => {
  console.error('Firebase question export failed.');
  console.error(error);
  process.exitCode = 1;
});
