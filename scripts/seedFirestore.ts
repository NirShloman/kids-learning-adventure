import { config as loadEnv } from 'dotenv';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { existsSync, readFileSync } from 'node:fs';
import { colorQuestions, letterQuestions, numberQuestions, shapeQuestions } from '../src/data/questions';
import { matchingPairs, memoryCards, patternPuzzles, sortingChallenges } from '../src/data/activityData';
import { assertQuestionBankContentApproved, reviewQuestionBankContent } from '../src/services/speechTherapistAgent';

loadEnv({ path: '.env', quiet: true });
loadEnv({ path: '.env.local', override: true, quiet: true });

interface ServiceAccountJson {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

function getCredential() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    if (!existsSync(serviceAccountPath)) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH does not exist: ${serviceAccountPath}`);
    }

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccountJson;
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Service account file is missing project_id, client_email, or private_key.');
    }

    return cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key
    });
  }

  return applicationDefault();
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID.');
  }

  const app = getApps()[0] ?? initializeApp({
    credential: getCredential(),
    projectId
  });
  const db = getFirestore(app);
  const seededAt = new Date().toISOString();
  const questionBank = {
    letters: letterQuestions,
    numbers: numberQuestions,
    shapes: shapeQuestions,
    colors: colorQuestions,
    matchingPairs,
    memoryCards,
    patternPuzzles,
    sortingChallenges
  };
  assertQuestionBankContentApproved(questionBank);
  const reviewReport = reviewQuestionBankContent(questionBank);

  console.log(`Seeding Firestore questionBank for project ${projectId}...`);
  console.log(`Quality review passed for ${reviewReport.summary.totalItems} question-bank items.`);

  await Promise.all([
    db.doc('questionBank/letters').set({ questions: letterQuestions }),
    db.doc('questionBank/numbers').set({ questions: numberQuestions }),
    db.doc('questionBank/shapes').set({ questions: shapeQuestions }),
    db.doc('questionBank/colors').set({ questions: colorQuestions }),
    db.doc('questionBank/matchingPairs').set({ items: matchingPairs }),
    db.doc('questionBank/memoryCards').set({ items: memoryCards }),
    db.doc('questionBank/patternPuzzles').set({ items: patternPuzzles }),
    db.doc('questionBank/sortingChallenges').set({ items: sortingChallenges }),
    db.doc('questionBank/_meta').set({
      version: 2,
      seededAt,
      publishedAt: seededAt,
      minAppVersion: '1.0.0',
      activePackIds: ['expanded-therapist-reviewed'],
      qualityReview: {
        approved: reviewReport.approved,
        rejectedItems: reviewReport.summary.rejectedItems,
        coverageIssues: reviewReport.summary.coverageIssues,
        reviewedAt: seededAt
      },
      counts: {
        letters: letterQuestions.length,
        numbers: numberQuestions.length,
        shapes: shapeQuestions.length,
        colors: colorQuestions.length,
        matchingPairs: matchingPairs.length,
        memoryCards: memoryCards.length,
        patternPuzzles: patternPuzzles.length,
        sortingChallenges: sortingChallenges.length
      }
    })
  ]);

  console.log('Firestore questionBank seed completed.');
}

main().catch((error) => {
  console.error('Firestore seed failed.');
  console.error(error);
  process.exitCode = 1;
});
