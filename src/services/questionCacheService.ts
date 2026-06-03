import { MatchingPair, MemoryCard, PatternPuzzle, QuizQuestion, SortingChallenge } from '../types';
import { ImageAssetId, imageAssets } from '../assets/assetManifest';
import {
  getMatchingPairsFromFirestore,
  getMemoryCardsFromFirestore,
  getPatternPuzzlesFromFirestore,
  getQuestionBankVersion,
  getQuizQuestionsFromFirestore,
  getSortingChallengesFromFirestore
} from './firestoreService';
import { trackEvent } from './analyticsService';
import { measureAsync } from './performanceService';

const CACHE_KEY = 'qbank';
const VERSION_KEY = 'qbank-version';
const GENERIC_ENGLISH_HINT = 'Look carefully at the choices and pick the one that matches.';
const GENERIC_HEBREW_HINT = 'בחרו את התשובה המתאימה.';

export interface QuestionBank {
  letters: QuizQuestion[];
  numbers: QuizQuestion[];
  shapes: QuizQuestion[];
  colors: QuizQuestion[];
  matchingPairs: MatchingPair[];
  memoryCards: MemoryCard[];
  patternPuzzles: PatternPuzzle[];
  sortingChallenges: SortingChallenge[];
  version: number | null;
}

const emptyQuestionBank: QuestionBank = {
  letters: [],
  numbers: [],
  shapes: [],
  colors: [],
  matchingPairs: [],
  memoryCards: [],
  patternPuzzles: [],
  sortingChallenges: [],
  version: null
};

let memoryCache: QuestionBank | null = null;

function isImageAssetId(value: string | undefined): value is ImageAssetId {
  return Boolean(value && value in imageAssets);
}

function sanitizeQuizQuestion(question: QuizQuestion): QuizQuestion {
  const unsafeImageAssetId = question.imageAssetId as string | undefined;
  const cleanedQuestion: QuizQuestion = {
    ...question,
    subtitle: question.subtitle?.trim() === GENERIC_ENGLISH_HINT || question.subtitle?.trim() === GENERIC_HEBREW_HINT ? undefined : question.subtitle,
    options: question.options.map((option) => ({ ...option }))
  };

  if (unsafeImageAssetId && !isImageAssetId(unsafeImageAssetId)) {
    delete cleanedQuestion.imageAssetId;
    cleanedQuestion.visual = cleanedQuestion.visual ?? unsafeImageAssetId;
  }

  return cleanedQuestion;
}

function sanitizeQuestionBank(questionBank: QuestionBank): QuestionBank {
  return {
    ...questionBank,
    letters: questionBank.letters.map(sanitizeQuizQuestion),
    numbers: questionBank.numbers.map(sanitizeQuizQuestion),
    shapes: questionBank.shapes.map(sanitizeQuizQuestion),
    colors: questionBank.colors.map(sanitizeQuizQuestion)
  };
}

async function loadBundledQuestionBank(): Promise<QuestionBank> {
  try {
    const [quizData, activityData] = await Promise.all([
      import('../data/questions'),
      import('../data/activityData')
    ]);

    return sanitizeQuestionBank({
      letters: quizData.letterQuestions,
      numbers: quizData.numberQuestions,
      shapes: quizData.shapeQuestions,
      colors: quizData.colorQuestions,
      matchingPairs: activityData.matchingPairs,
      memoryCards: activityData.memoryCards,
      patternPuzzles: activityData.patternPuzzles,
      sortingChallenges: activityData.sortingChallenges,
      version: null
    });
  } catch {
    return emptyQuestionBank;
  }
}

function readLocalCache(): QuestionBank | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(CACHE_KEY);
    return rawValue ? sanitizeQuestionBank(JSON.parse(rawValue) as QuestionBank) : null;
  } catch {
    return null;
  }
}

function getLocalVersion(): number | null {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(VERSION_KEY);
  const parsed = rawValue ? Number(rawValue) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function writeLocalCache(questionBank: QuestionBank): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(CACHE_KEY, JSON.stringify(questionBank));
  if (questionBank.version !== null) window.localStorage.setItem(VERSION_KEY, String(questionBank.version));
}

async function loadFromFirestore(version: number | null): Promise<QuestionBank | null> {
  try {
    const [letters, numbers, shapes, colors, matchingPairs, memoryCards, patternPuzzles, sortingChallenges] = await Promise.all([
      getQuizQuestionsFromFirestore('letters'),
      getQuizQuestionsFromFirestore('numbers'),
      getQuizQuestionsFromFirestore('shapes'),
      getQuizQuestionsFromFirestore('colors'),
      getMatchingPairsFromFirestore(),
      getMemoryCardsFromFirestore(),
      getPatternPuzzlesFromFirestore(),
      getSortingChallengesFromFirestore()
    ]);

    const hasAnyData = [
      letters,
      numbers,
      shapes,
      colors,
      matchingPairs,
      memoryCards,
      patternPuzzles,
      sortingChallenges
    ].some((items) => items.length > 0);

    if (!hasAnyData) return null;

    return sanitizeQuestionBank({
      letters,
      numbers,
      shapes,
      colors,
      matchingPairs,
      memoryCards,
      patternPuzzles,
      sortingChallenges,
      version
    });
  } catch {
    return null;
  }
}

export async function loadQuestionBank(): Promise<QuestionBank> {
  if (memoryCache) {
    trackEvent('question_bank_cache_hit');
    return memoryCache;
  }

  const localCache = readLocalCache();
  const localVersion = getLocalVersion();
  const remoteVersion = await getQuestionBankVersion().catch(() => null);

  if (localCache && remoteVersion !== null && localVersion === remoteVersion) {
    memoryCache = localCache;
    trackEvent('question_bank_cache_hit');
    return memoryCache;
  }

  trackEvent('question_bank_cache_miss');
  const firestoreBank = await measureAsync('questionBank.load', () => loadFromFirestore(remoteVersion));
  if (firestoreBank) {
    memoryCache = firestoreBank;
    writeLocalCache(firestoreBank);
    trackEvent('question_bank_loaded');
    return firestoreBank;
  }

  if (localCache) {
    memoryCache = localCache;
    return memoryCache;
  }

  memoryCache = await loadBundledQuestionBank();
  return memoryCache;
}

export function invalidateQuestionBankCache(): void {
  memoryCache = null;
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CACHE_KEY);
  window.localStorage.removeItem(VERSION_KEY);
}
