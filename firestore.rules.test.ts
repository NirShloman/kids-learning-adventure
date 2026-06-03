import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

let testEnv: RulesTestEnvironment;

const projectId = 'kidslearningadventure-rules-test';

function player(ownerId: string) {
  return {
    id: 'player-1',
    ownerId,
    name: 'Test Player',
    age: 4,
    difficulty: 'easy',
    createdAt: '2026-05-28T00:00:00.000Z'
  };
}

function session(ownerId: string) {
  return {
    id: 'session-1',
    ownerId,
    playerId: 'player-1',
    gameId: 'letters',
    gameTitle: 'Letters',
    age: 4,
    difficulty: 'easy',
    score: 8,
    total: 10,
    stars: 2,
    completedAt: '2026-05-28T00:00:00.000Z',
    syncStatus: 'synced'
  };
}

function canonicalQuestion(status = 'approved') {
  return {
    id: 'question-1',
    prompt: 'איזו אות פותחת את המילה שמש?',
    options: [
      { id: 'a', text: 'ש' },
      { id: 'b', text: 'מ' },
      { id: 'c', text: 'ת' }
    ],
    correctOptionId: 'a',
    worldId: 'letters',
    skillId: 'initial-sound',
    ageRange: '4-5',
    difficulty: 3,
    questionType: 'single-choice',
    language: 'he',
    tags: ['letters', 'initial-sound'],
    estimatedTimeSeconds: 20,
    pedagogicalGoal: 'זיהוי אות פותחת',
    hint: 'הקשיבו לצליל הראשון.',
    explanationForParent: 'השאלה מחזקת מודעות לצליל פותח.',
    status,
    createdBy: 'content_editor',
    createdAt: '2026-06-03T00:00:00.000Z',
    updatedAt: '2026-06-03T00:00:00.000Z',
    version: 1
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firebase/firestore.rules', 'utf8')
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('firestore rules', () => {
  it('allows a signed in user to create and read their own player', async () => {
    const db = testEnv.authenticatedContext('uid-a').firestore();
    const ref = doc(db, 'players/player-1');

    await assertSucceeds(setDoc(ref, player('uid-a')));
    await assertSucceeds(getDoc(ref));
  });

  it('blocks creating a player for another owner', async () => {
    const db = testEnv.authenticatedContext('uid-a').firestore();
    await assertFails(setDoc(doc(db, 'players/player-1'), player('uid-b')));
  });

  it('blocks reading another user player', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'players/player-1'), player('uid-b'));
    });

    const db = testEnv.authenticatedContext('uid-a').firestore();
    await assertFails(getDoc(doc(db, 'players/player-1')));
  });

  it('protects sessions by ownerId', async () => {
    const ownerDb = testEnv.authenticatedContext('uid-a').firestore();
    const otherDb = testEnv.authenticatedContext('uid-b').firestore();

    await assertSucceeds(setDoc(doc(ownerDb, 'sessions/session-1'), session('uid-a')));
    await assertFails(getDoc(doc(otherDb, 'sessions/session-1')));
    await assertFails(setDoc(doc(ownerDb, 'sessions/session-2'), session('uid-b')));
  });

  it('blocks anonymous public access to private progress', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'players/player-1')));
    await assertFails(setDoc(doc(db, 'sessions/session-1'), session('uid-a')));
  });

  it('allows public reads and blocks client writes for questionBank', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'questionBank/_meta'), { version: 1 });
    });

    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'questionBank/_meta')));
    await assertFails(setDoc(doc(db, 'questionBank/_meta'), { version: 2 }));
  });

  it('allows public reads for approved canonical questions only', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'questions/question-1'), canonicalQuestion('approved'));
      await setDoc(doc(context.firestore(), 'questions/question-2'), {
        ...canonicalQuestion('archived'),
        id: 'question-2'
      });
    });

    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'questions/question-1')));
    await assertFails(getDoc(doc(db, 'questions/question-2')));
  });

  it('blocks non-admin writes to approved questions', async () => {
    const publicDb = testEnv.unauthenticatedContext().firestore();
    const userDb = testEnv.authenticatedContext('uid-a').firestore();

    await assertFails(setDoc(doc(publicDb, 'questions/question-1'), canonicalQuestion('approved')));
    await assertFails(setDoc(doc(userDb, 'questions/question-1'), canonicalQuestion('approved')));
  });

  it('allows content admin writes to approved questions', async () => {
    const adminDb = testEnv.authenticatedContext('admin-uid', { admin: true }).firestore();
    await assertSucceeds(setDoc(doc(adminDb, 'questions/question-1'), canonicalQuestion('approved')));
  });

  it('allows signed-in pending submissions but blocks direct approval', async () => {
    const userDb = testEnv.authenticatedContext('uid-a').firestore();
    await assertSucceeds(setDoc(doc(userDb, 'pendingQuestionSubmissions/question-1'), canonicalQuestion('pending_review')));
    await assertFails(setDoc(doc(userDb, 'pendingQuestionSubmissions/question-2'), {
      ...canonicalQuestion('approved'),
      id: 'question-2'
    }));
  });
});
