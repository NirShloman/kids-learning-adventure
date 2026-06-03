import {
  Age,
  AgeRange,
  Difficulty,
  GameQuestion,
  LearningWorldId,
  QuestionDifficulty,
  QuestionType,
  QuizQuestion,
  SkillId
} from '../../types';
import { ImageAssetId, imageAssets } from '../../assets/assetManifest';
import { shuffleArray } from '../../utils/helpers';
import { loadQuestionBank } from '../questionCacheService';
import { getApprovedQuizQuestions } from '../speechTherapistAgent';
import {
  getApprovedQuestions,
  getQuestionsByWorld
} from '../firebase/questionRepository';

const QUIZ_WORLD_IDS: QuizQuestion['category'][] = ['letters', 'numbers', 'shapes', 'colors'];
const CONTENT_CREATED_AT = '2026-06-03T00:00:00.000Z';
const GENERIC_ENGLISH_HINT = 'Look carefully at the choices and pick the one that matches.';
const GENERIC_HEBREW_HINT = 'בחרו את התשובה המתאימה.';

const WORLD_TO_SKILL: Record<QuizQuestion['category'], SkillId> = {
  letters: 'letters',
  numbers: 'numbers',
  shapes: 'shapes',
  colors: 'colors'
};

function isQuizWorld(worldId: LearningWorldId): worldId is QuizQuestion['category'] {
  return QUIZ_WORLD_IDS.includes(worldId as QuizQuestion['category']);
}

function isImageAssetId(value: string | undefined): value is ImageAssetId {
  return Boolean(value && value in imageAssets);
}

function cleanHint(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  if (!trimmedValue || trimmedValue === GENERIC_ENGLISH_HINT || trimmedValue === GENERIC_HEBREW_HINT) return undefined;
  return trimmedValue;
}

function mapIllustrationKeyToQuizVisual(value: string | undefined): Pick<QuizQuestion, 'imageAssetId' | 'visual'> {
  if (!value) return {};
  if (isImageAssetId(value)) return { imageAssetId: value };
  return { visual: value };
}

export function ageToAgeRange(age: Age): AgeRange {
  if (age <= 4) return '3-4';
  if (age === 5) return '4-5';
  return '5-6';
}

export function ageRangeToAges(ageRange: AgeRange): Age[] {
  if (ageRange === '3-4') return [3, 4];
  if (ageRange === '4-5') return [4, 5];
  return [5, 6];
}

export function difficultyToQuestionDifficulty(difficulty: Difficulty, age?: Age): QuestionDifficulty {
  if (difficulty === 'easy') return age && age <= 3 ? 1 : 2;
  if (difficulty === 'medium') return age && age >= 5 ? 3 : 2;
  return age && age >= 6 ? 5 : 4;
}

export function questionDifficultyToDifficulty(difficulty: QuestionDifficulty): Difficulty {
  if (difficulty <= 2) return 'easy';
  if (difficulty === 3) return 'medium';
  return 'hard';
}

function inferAgeRange(question: QuizQuestion): AgeRange {
  if (question.difficulty === 'easy') return '3-4';
  if (question.difficulty === 'hard') return '5-6';
  if (question.age.includes(5)) return '4-5';
  return ageToAgeRange(question.age[0] ?? 4);
}

function inferQuestionType(question: QuizQuestion): QuestionType {
  if (question.imageAssetId || question.visual || question.options.some((option) => option.emoji)) return 'image-choice';
  return 'single-choice';
}

function inferSkill(question: QuizQuestion): SkillId {
  if (question.category === 'letters') {
    if (question.id.includes('initial') || question.prompt.includes('פותחת')) return 'initial-sound';
    return 'letters';
  }
  if (question.category === 'numbers') return question.prompt.includes('ספ') ? 'counting' : 'numbers';
  return WORLD_TO_SKILL[question.category];
}

function createPedagogicalGoal(question: QuizQuestion): string {
  const goals: Record<QuizQuestion['category'], string> = {
    letters: 'Practice Hebrew letter recognition and early phonological awareness.',
    numbers: 'Practice number recognition, counting, and early quantity reasoning.',
    shapes: 'Practice shape recognition and visual classification.',
    colors: 'Practice color recognition and object-color matching.'
  };
  return goals[question.category];
}

export function mapQuizQuestionToGameQuestion(question: QuizQuestion, index = 0): GameQuestion {
  const ageRange = inferAgeRange(question);
  const difficulty = difficultyToQuestionDifficulty(question.difficulty, ageRangeToAges(ageRange)[0]);
  const createdAt = CONTENT_CREATED_AT;

  return {
    id: question.id,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      id: option.id,
      text: option.label,
      media: option.emoji ? { illustrationKey: option.emoji } : undefined
    })),
    correctOptionId: question.correctOptionId,
    worldId: question.category,
    skillId: inferSkill(question),
    ageRange,
    difficulty,
    questionType: inferQuestionType(question),
    media: question.imageAssetId
      ? { illustrationKey: question.imageAssetId }
      : question.visual
        ? { illustrationKey: question.visual }
        : undefined,
    language: 'he',
    tags: [
      question.category,
      inferSkill(question),
      question.difficulty,
      ageRange
    ],
    estimatedTimeSeconds: ageRange === '3-4' ? 18 : ageRange === '4-5' ? 24 : 30,
    pedagogicalGoal: createPedagogicalGoal(question),
    explanationForParent: 'This question practices one focused early-learning skill in a short, game-ready format.',
    hint: cleanHint(question.subtitle) ?? GENERIC_HEBREW_HINT,
    audioText: question.audioText ?? question.prompt,
    status: 'approved',
    createdBy: 'system',
    createdAt,
    updatedAt: createdAt,
    approvedAt: createdAt,
    version: 1 + Math.floor(index / 120)
  };
}

export function mapGameQuestionToQuizQuestion(question: GameQuestion): QuizQuestion | null {
  if (!isQuizWorld(question.worldId)) return null;
  const questionVisual = mapIllustrationKeyToQuizVisual(question.media?.illustrationKey);

  return {
    id: question.id,
    category: question.worldId,
    age: ageRangeToAges(question.ageRange),
    difficulty: questionDifficultyToDifficulty(question.difficulty),
    prompt: question.prompt,
    subtitle: cleanHint(question.hint),
    ...questionVisual,
    audioText: question.audioText ?? question.prompt,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.text,
      emoji: isImageAssetId(option.media?.illustrationKey) ? undefined : option.media?.illustrationKey
    })),
    correctOptionId: question.correctOptionId
  };
}

export async function loadBundledGameQuestions(): Promise<GameQuestion[]> {
  const questionBank = await loadQuestionBank();
  const quizQuestions = [
    ...questionBank.letters,
    ...questionBank.numbers,
    ...questionBank.shapes,
    ...questionBank.colors
  ];

  return getApprovedQuizQuestions(quizQuestions).map(mapQuizQuestionToGameQuestion);
}

export async function getApprovedGameQuestions(): Promise<GameQuestion[]> {
  const remoteQuestions = await getApprovedQuestions().catch(() => []);
  if (remoteQuestions.length) return remoteQuestions;
  return loadBundledGameQuestions();
}

export async function getPlayableQuizQuestions(gameId: QuizQuestion['category'], age: Age, difficulty: Difficulty): Promise<QuizQuestion[]> {
  const requestedAgeRange = ageToAgeRange(age);
  const requestedDifficulty = difficultyToQuestionDifficulty(difficulty, age);
  const remoteQuestions = await getQuestionsByWorld(gameId).catch(() => []);
  const sourceQuestions = remoteQuestions.length ? remoteQuestions : await loadBundledGameQuestions();
  const eligible = sourceQuestions.filter((question) => (
    question.status === 'approved' &&
    question.worldId === gameId &&
    question.ageRange === requestedAgeRange &&
    question.difficulty === requestedDifficulty
  ));
  const fallback = sourceQuestions.filter((question) => (
    question.status === 'approved' &&
    question.worldId === gameId &&
    question.ageRange === requestedAgeRange
  ));
  const playableQuestions = (eligible.length ? eligible : fallback)
    .map(mapGameQuestionToQuizQuestion)
    .filter((question): question is QuizQuestion => Boolean(question));

  return shuffleArray(playableQuestions);
}

export const questionProvider = {
  ageToAgeRange,
  ageRangeToAges,
  difficultyToQuestionDifficulty,
  questionDifficultyToDifficulty,
  mapQuizQuestionToGameQuestion,
  mapGameQuestionToQuizQuestion,
  loadBundledGameQuestions,
  getApprovedGameQuestions,
  getPlayableQuizQuestions
};
