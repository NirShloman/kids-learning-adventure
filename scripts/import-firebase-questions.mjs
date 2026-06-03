import { config as loadEnv } from 'dotenv';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  checkDuplicateQuestion,
  checkDuplicateQuestions,
  readSeedQuestions,
  reviewQuestionContent,
  validateQuestions
} from './content-quality.mjs';

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

async function getExistingApprovedQuestions(db) {
  const snapshot = await db.collection('questions').where('status', '==', 'approved').get();
  return snapshot.docs.map((doc) => doc.data());
}

async function commitInChunks(db, questions, importedAt) {
  for (let index = 0; index < questions.length; index += 450) {
    const batch = db.batch();
    questions.slice(index, index + 450).forEach((question) => {
      batch.set(db.collection('questions').doc(question.id), {
        ...question,
        status: 'approved',
        updatedAt: importedAt,
        approvedAt: question.approvedAt ?? importedAt
      }, { merge: true });
      batch.set(db.collection('questionReviewReports').doc(`${question.id}-${importedAt}`), {
        questionId: question.id,
        createdAt: importedAt,
        report: question.review
      });
      if (question.duplicate) {
        batch.set(db.collection('questionDuplicates').doc(`${question.id}-${importedAt}`), {
          questionId: question.id,
          createdAt: importedAt,
          duplicate: question.duplicate
        });
      }
    });
    await batch.commit();
  }
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Missing FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID.');

  const seedQuestions = readSeedQuestions();
  const validation = validateQuestions(seedQuestions);
  const internalDuplicateMatches = checkDuplicateQuestions(seedQuestions);
  const internalDuplicates = internalDuplicateMatches.filter((match) => match.isDuplicate);

  mkdirSync('reports', { recursive: true });

  if (!validation.valid || internalDuplicates.length) {
    writeFileSync('reports/import-summary.json', `${JSON.stringify({
      importedAt: new Date().toISOString(),
      attempted: seedQuestions.length,
      imported: 0,
      rejected: seedQuestions.length,
      validationErrors: validation.errors,
      duplicateMatches: internalDuplicateMatches
    }, null, 2)}\n`, 'utf8');
    throw new Error('Seed content failed validation or duplicate checks.');
  }

  const app = getApps()[0] ?? initializeApp({ credential: getCredential(), projectId });
  const db = getFirestore(app);
  const existingQuestions = await getExistingApprovedQuestions(db);
  const importedAt = new Date().toISOString();
  const accepted = [];
  const rejected = [];

  seedQuestions.forEach((question) => {
    const duplicate = checkDuplicateQuestion(question, [...existingQuestions, ...accepted]);
    const review = reviewQuestionContent({ ...question, duplicate });
    if (review.approved && !duplicate.isDuplicate && !duplicate.isSimilar) {
      accepted.push({ ...question, duplicate, review, status: 'approved' });
    } else {
      rejected.push({ id: question.id, duplicate, review });
    }
  });

  await commitInChunks(db, accepted, importedAt);

  writeFileSync('reports/rejected-questions.json', `${JSON.stringify(rejected, null, 2)}\n`, 'utf8');
  writeFileSync('reports/import-summary.json', `${JSON.stringify({
    importedAt,
    attempted: seedQuestions.length,
    imported: accepted.length,
    rejected: rejected.length
  }, null, 2)}\n`, 'utf8');

  console.log(`Imported ${accepted.length}/${seedQuestions.length} approved questions to Firestore project ${projectId}.`);
  if (rejected.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Firebase question import failed.');
  console.error(error);
  process.exitCode = 1;
});
