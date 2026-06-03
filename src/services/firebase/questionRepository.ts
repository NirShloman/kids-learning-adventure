import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import {
  AgeRange,
  DuplicateCheckResult,
  GameQuestion,
  LearningWorldId,
  QuestionReviewReport,
  QuestionStatus,
  SkillId
} from '../../types';
import { checkDuplicateQuestion } from '../contentReview/duplicateQuestionDetector';
import { reviewQuestionContent } from '../contentReview/contentReviewAgent';
import { getFirestoreClient, requireFirestoreClient } from './firebaseClient';

const QUESTIONS_COLLECTION = 'questions';
const PENDING_COLLECTION = 'pendingQuestionSubmissions';
const REVIEW_REPORTS_COLLECTION = 'questionReviewReports';
const DUPLICATES_COLLECTION = 'questionDuplicates';
const AUDIT_LOGS_COLLECTION = 'auditLogs';

export interface QuestionImportSummary {
  attempted: number;
  imported: number;
  rejected: number;
  similar: number;
  rejectedQuestions: Array<{
    id: string;
    review: QuestionReviewReport;
    duplicate: DuplicateCheckResult;
  }>;
}

function cleanForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

function withReviewArtifacts(question: GameQuestion, existingQuestions: GameQuestion[]) {
  const duplicate = checkDuplicateQuestion(question, existingQuestions);
  const review = reviewQuestionContent({ ...question, duplicate });
  return { duplicate, review };
}

async function getQuestionsByStatus(status: QuestionStatus, maxItems = 200): Promise<GameQuestion[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  const snapshot = await getDocs(query(
    collection(db, QUESTIONS_COLLECTION),
    where('status', '==', status),
    orderBy('updatedAt', 'desc'),
    limitQuery(maxItems)
  ));

  return snapshot.docs.map((questionDoc) => questionDoc.data() as GameQuestion);
}

async function getPendingSubmissionsByStatus(statuses: QuestionStatus[], maxItems = 200): Promise<GameQuestion[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  const snapshot = await getDocs(query(
    collection(db, PENDING_COLLECTION),
    where('status', 'in', statuses),
    orderBy('updatedAt', 'desc'),
    limitQuery(maxItems)
  ));

  return snapshot.docs.map((questionDoc) => questionDoc.data() as GameQuestion);
}

export async function getApprovedQuestions(maxItems = 500): Promise<GameQuestion[]> {
  return getQuestionsByStatus('approved', maxItems);
}

export async function getQuestionsByWorld(worldId: LearningWorldId): Promise<GameQuestion[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  const snapshot = await getDocs(query(
    collection(db, QUESTIONS_COLLECTION),
    where('status', '==', 'approved'),
    where('worldId', '==', worldId),
    limitQuery(200)
  ));
  return snapshot.docs.map((questionDoc) => questionDoc.data() as GameQuestion);
}

export async function getQuestionsByAge(ageRange: AgeRange): Promise<GameQuestion[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  const snapshot = await getDocs(query(
    collection(db, QUESTIONS_COLLECTION),
    where('status', '==', 'approved'),
    where('ageRange', '==', ageRange),
    limitQuery(200)
  ));
  return snapshot.docs.map((questionDoc) => questionDoc.data() as GameQuestion);
}

export async function getQuestionsBySkill(skillId: SkillId): Promise<GameQuestion[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  const snapshot = await getDocs(query(
    collection(db, QUESTIONS_COLLECTION),
    where('status', '==', 'approved'),
    where('skillId', '==', skillId),
    limitQuery(200)
  ));
  return snapshot.docs.map((questionDoc) => questionDoc.data() as GameQuestion);
}

export async function getQuestionById(questionId: string): Promise<GameQuestion | null> {
  const db = getFirestoreClient();
  if (!db) return null;

  const approvedSnapshot = await getDoc(doc(db, QUESTIONS_COLLECTION, questionId));
  if (approvedSnapshot.exists()) return approvedSnapshot.data() as GameQuestion;

  const pendingSnapshot = await getDoc(doc(db, PENDING_COLLECTION, questionId));
  return pendingSnapshot.exists() ? pendingSnapshot.data() as GameQuestion : null;
}

export async function checkSimilarQuestions(question: GameQuestion): Promise<DuplicateCheckResult> {
  const existingQuestions = [
    ...await getApprovedQuestions(),
    ...await getPendingQuestions()
  ];
  return checkDuplicateQuestion(question, existingQuestions);
}

export async function submitQuestionForReview(question: GameQuestion): Promise<GameQuestion> {
  const db = requireFirestoreClient();
  const existingQuestions = [
    ...await getApprovedQuestions(),
    ...await getPendingQuestions()
  ];
  const duplicate = checkDuplicateQuestion(question, existingQuestions);
  const review = reviewQuestionContent({ ...question, duplicate });
  const submittedAt = nowIso();
  const status: QuestionStatus = review.status === 'rejected' ? 'rejected' : review.status === 'needs_changes' ? 'needs_changes' : 'pending_review';
  const submission: GameQuestion = {
    ...question,
    duplicate,
    review,
    status,
    updatedAt: submittedAt,
    createdAt: question.createdAt || submittedAt,
    approvedAt: undefined
  };

  await setDoc(doc(db, PENDING_COLLECTION, submission.id), cleanForFirestore(submission));

  await Promise.all([
    setDoc(doc(db, REVIEW_REPORTS_COLLECTION, `${submission.id}-${submittedAt}`), cleanForFirestore({
      questionId: submission.id,
      createdAt: submittedAt,
      report: review
    })),
    setDoc(doc(db, DUPLICATES_COLLECTION, `${submission.id}-${submittedAt}`), cleanForFirestore({
      questionId: submission.id,
      createdAt: submittedAt,
      duplicate
    }))
  ]).catch(() => undefined);

  return submission;
}

export async function updateQuestionReviewStatus(
  questionId: string,
  status: Extract<QuestionStatus, 'approved' | 'rejected' | 'needs_changes' | 'archived'>,
  updates: Partial<GameQuestion> = {}
): Promise<GameQuestion> {
  const db = requireFirestoreClient();
  const existingQuestion = await getQuestionById(questionId);
  if (!existingQuestion) throw new Error(`Question not found: ${questionId}`);

  const updatedAt = nowIso();
  const nextQuestion: GameQuestion = {
    ...existingQuestion,
    ...updates,
    status,
    updatedAt,
    approvedAt: status === 'approved' ? updatedAt : existingQuestion.approvedAt
  };

  const batch = writeBatch(db);
  const pendingRef = doc(db, PENDING_COLLECTION, questionId);
  const approvedRef = doc(db, QUESTIONS_COLLECTION, questionId);

  if (status === 'approved' || status === 'archived') {
    batch.set(approvedRef, cleanForFirestore(nextQuestion), { merge: true });
    batch.set(pendingRef, cleanForFirestore({ status, updatedAt }), { merge: true });
  } else {
    batch.set(pendingRef, cleanForFirestore(nextQuestion), { merge: true });
  }

  batch.set(doc(db, AUDIT_LOGS_COLLECTION, `${questionId}-${updatedAt}`), cleanForFirestore({
    questionId,
    action: `status:${status}`,
    createdAt: updatedAt
  }));

  await batch.commit();
  return nextQuestion;
}

export async function importSeedQuestions(seedQuestions: GameQuestion[]): Promise<QuestionImportSummary> {
  const db = requireFirestoreClient();
  const existingQuestions = await getApprovedQuestions(1000);
  const imported: GameQuestion[] = [];
  const rejectedQuestions: QuestionImportSummary['rejectedQuestions'] = [];
  let similar = 0;

  const batch = writeBatch(db);
  const importedAt = nowIso();

  seedQuestions.forEach((question) => {
    const { duplicate, review } = withReviewArtifacts(question, [...existingQuestions, ...imported]);
    const reviewedQuestion: GameQuestion = {
      ...question,
      duplicate,
      review,
      status: review.approved && !duplicate.isDuplicate && !duplicate.isSimilar ? 'approved' : review.status,
      updatedAt: importedAt,
      approvedAt: review.approved && !duplicate.isDuplicate && !duplicate.isSimilar ? importedAt : undefined
    };

    if (duplicate.isSimilar) similar += 1;

    if (reviewedQuestion.status === 'approved') {
      imported.push(reviewedQuestion);
      batch.set(doc(db, QUESTIONS_COLLECTION, reviewedQuestion.id), cleanForFirestore(reviewedQuestion));
    } else {
      rejectedQuestions.push({ id: question.id, review, duplicate });
    }
  });

  await batch.commit();

  return {
    attempted: seedQuestions.length,
    imported: imported.length,
    rejected: rejectedQuestions.length,
    similar,
    rejectedQuestions
  };
}

export async function getPendingQuestions(): Promise<GameQuestion[]> {
  return getPendingSubmissionsByStatus(['pending_review', 'needs_changes']);
}

export async function getRejectedQuestions(): Promise<GameQuestion[]> {
  const rejectedApprovedCollection = await getQuestionsByStatus('rejected');
  const rejectedPendingCollection = await getPendingSubmissionsByStatus(['rejected']);
  return [...rejectedApprovedCollection, ...rejectedPendingCollection];
}

export async function getApprovedQuestionCount(): Promise<number> {
  const db = getFirestoreClient();
  if (!db) return 0;

  const countSnapshot = await getCountFromServer(query(
    collection(db, QUESTIONS_COLLECTION),
    where('status', '==', 'approved')
  ));
  return countSnapshot.data().count;
}

export async function saveQuestionDraft(question: GameQuestion): Promise<GameQuestion> {
  const db = requireFirestoreClient();
  const updatedAt = nowIso();
  const draft: GameQuestion = {
    ...question,
    status: 'draft',
    updatedAt,
    createdAt: question.createdAt || updatedAt
  };

  await setDoc(doc(db, PENDING_COLLECTION, draft.id), cleanForFirestore(draft), { merge: true });
  return draft;
}

export const questionRepository = {
  getApprovedQuestions,
  getQuestionsByWorld,
  getQuestionsByAge,
  getQuestionsBySkill,
  getQuestionById,
  submitQuestionForReview,
  updateQuestionReviewStatus,
  checkSimilarQuestions,
  importSeedQuestions,
  getPendingQuestions,
  getRejectedQuestions,
  getApprovedQuestionCount,
  saveQuestionDraft
};
