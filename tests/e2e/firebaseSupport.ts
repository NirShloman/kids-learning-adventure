import { expect, Page, test } from '@playwright/test';
import { connect } from 'node:net';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'demo-kids-learning-e2e';
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

export interface E2EFirebaseQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  worldId: string;
  skillId: string;
  ageRange: string;
  difficulty: number;
  questionType: string;
  language: 'he';
  tags: string[];
  estimatedTimeSeconds: number;
  pedagogicalGoal: string;
  hint: string;
  explanationForParent: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  version: number;
}

function parseHost(value: string) {
  const [host, rawPort] = value.split(':');
  return { host, port: Number(rawPort) };
}

async function canConnect(value: string): Promise<boolean> {
  const { host, port } = parseHost(value);
  return new Promise((resolve) => {
    const socket = connect({ host, port, timeout: 800 }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

export async function skipIfFirebaseEmulatorUnavailable() {
  const enabled = process.env.E2E_USE_FIREBASE === '1';
  const firestoreReady = await canConnect(firestoreHost);
  const authReady = await canConnect(authHost);
  test.skip(!enabled || !firestoreReady || !authReady, `Firebase emulator suite requires E2E_USE_FIREBASE=1, Firestore ${firestoreHost}, and Auth ${authHost}.`);
}

export function getAdminDb() {
  const app = getApps()[0] ?? initializeApp({ projectId });
  return getFirestore(app);
}

export async function clearE2ECollections() {
  const db = getAdminDb();
  const collections = ['questions', 'pendingQuestionSubmissions', 'questionReviewReports', 'questionDuplicates', 'auditLogs'];

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
}

export function createApprovedQuestion(overrides: Partial<E2EFirebaseQuestion> = {}): E2EFirebaseQuestion {
  const now = new Date().toISOString();
  return {
    id: 'e2e-approved-letter',
    prompt: 'בדיקת אמולטור: איזו אות פותחת את המילה שמש?',
    options: [
      { id: 'a', text: 'ש' },
      { id: 'b', text: 'מ' },
      { id: 'c', text: 'ת' }
    ],
    correctOptionId: 'a',
    worldId: 'letters',
    skillId: 'initial-sound',
    ageRange: '3-4',
    difficulty: 2,
    questionType: 'single-choice',
    language: 'he',
    tags: ['e2e', 'letters', 'initial-sound'],
    estimatedTimeSeconds: 20,
    pedagogicalGoal: 'בדיקת טעינת שאלה מאושרת מהאמולטור',
    hint: 'הקשיבו לצליל הראשון.',
    explanationForParent: 'שאלה לבדיקת E2E מול Firestore Emulator.',
    status: 'approved',
    createdBy: 'content_editor',
    createdAt: now,
    updatedAt: now,
    approvedAt: now,
    version: 1,
    ...overrides
  };
}

export async function seedApprovedQuestion(question: E2EFirebaseQuestion) {
  await getAdminDb().collection('questions').doc(question.id).set(question);
}

export async function expectPendingSubmissionCreated(page: Page, promptText: string) {
  await expect.poll(async () => {
    const snapshot = await getAdminDb().collection('pendingQuestionSubmissions').get();
    return snapshot.docs.some((document) => String(document.data().prompt).includes(promptText));
  }, { timeout: 10_000 }).toBe(true);
}
