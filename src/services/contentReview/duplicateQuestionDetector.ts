import { DuplicateCheckResult, GameQuestion } from '../../types';

const DUPLICATE_THRESHOLD = 0.92;
const SIMILAR_THRESHOLD = 0.78;

const FINAL_LETTER_MAP: Record<string, string> = {
  ך: 'כ',
  ם: 'מ',
  ן: 'נ',
  ף: 'פ',
  ץ: 'צ'
};

function normalizeFinalLetters(value: string): string {
  return value.replace(/[ךםןףץ]/g, (letter) => FINAL_LETTER_MAP[letter] ?? letter);
}

export function normalizeHebrewText(value: string): string {
  return normalizeFinalLetters(value)
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function createNormalizedPrompt(question: Pick<GameQuestion, 'prompt'>): string {
  return normalizeHebrewText(question.prompt);
}

export function createQuestionFingerprint(
  question: Pick<GameQuestion, 'prompt' | 'worldId' | 'skillId' | 'ageRange' | 'options' | 'correctOptionId'>
): string {
  const correctAnswer = question.options.find((option) => option.id === question.correctOptionId)?.text ?? '';
  return [
    question.worldId,
    question.skillId,
    question.ageRange,
    normalizeHebrewText(question.prompt),
    normalizeHebrewText(correctAnswer)
  ].join('|');
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function levenshteinSimilarity(left: string, right: string): number {
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  return 1 - levenshteinDistance(left, right) / maxLength;
}

function tokenOverlap(left: string, right: string): number {
  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));
  if (!leftTokens.size && !rightTokens.size) return 1;
  if (!leftTokens.size || !rightTokens.size) return 0;

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

function optionOverlap(question: GameQuestion, candidate: GameQuestion): number {
  const questionOptions = new Set(question.options.map((option) => normalizeHebrewText(option.text)));
  const candidateOptions = new Set(candidate.options.map((option) => normalizeHebrewText(option.text)));
  if (!questionOptions.size && !candidateOptions.size) return 1;

  const intersection = [...questionOptions].filter((option) => candidateOptions.has(option)).length;
  const union = new Set([...questionOptions, ...candidateOptions]).size;
  return union ? intersection / union : 0;
}

export function calculateQuestionSimilarity(question: GameQuestion, candidate: GameQuestion): number {
  const normalizedPrompt = createNormalizedPrompt(question);
  const normalizedCandidatePrompt = createNormalizedPrompt(candidate);
  const promptScore = Math.max(
    levenshteinSimilarity(normalizedPrompt, normalizedCandidatePrompt),
    tokenOverlap(normalizedPrompt, normalizedCandidatePrompt)
  );
  const optionsScore = optionOverlap(question, candidate);
  const sameCorrectAnswer = normalizeHebrewText(
    question.options.find((option) => option.id === question.correctOptionId)?.text ?? ''
  ) === normalizeHebrewText(candidate.options.find((option) => option.id === candidate.correctOptionId)?.text ?? '');
  const sameSkill = question.skillId === candidate.skillId ? 0.08 : 0;
  const sameWorld = question.worldId === candidate.worldId ? 0.05 : 0;
  const sameAge = question.ageRange === candidate.ageRange ? 0.04 : 0;
  const sameGoal = normalizeHebrewText(question.pedagogicalGoal) === normalizeHebrewText(candidate.pedagogicalGoal) ? 0.05 : 0;
  const correctAnswerBonus = sameCorrectAnswer ? 0.08 : 0;
  const rawScore = promptScore * 0.65 + optionsScore * 0.15 + sameSkill + sameWorld + sameAge + sameGoal + correctAnswerBonus;

  return Math.min(1, sameCorrectAnswer ? rawScore : rawScore * 0.9);
}

export function checkDuplicateQuestion(question: GameQuestion, existingQuestions: GameQuestion[]): DuplicateCheckResult {
  const fingerprint = createQuestionFingerprint(question);
  let bestScore = 0;
  const matchedQuestionIds: string[] = [];
  let reason = '';

  existingQuestions.forEach((candidate) => {
    if (candidate.id === question.id) return;

    const candidateFingerprint = createQuestionFingerprint(candidate);
    const score = fingerprint === candidateFingerprint
      ? 1
      : calculateQuestionSimilarity(question, candidate);

    if (score > bestScore) bestScore = score;
    if (score >= SIMILAR_THRESHOLD) matchedQuestionIds.push(candidate.id);
  });

  if (bestScore >= DUPLICATE_THRESHOLD) {
    reason = 'Question is an exact or near-exact duplicate of existing content.';
  } else if (bestScore >= SIMILAR_THRESHOLD) {
    reason = 'Question is similar enough to require manual review.';
  }

  return {
    isDuplicate: bestScore >= DUPLICATE_THRESHOLD,
    isSimilar: bestScore >= SIMILAR_THRESHOLD && bestScore < DUPLICATE_THRESHOLD,
    similarityScore: Number(bestScore.toFixed(3)),
    matchedQuestionIds,
    reason: reason || undefined
  };
}

export const duplicateQuestionDetector = {
  normalizeHebrewText,
  createNormalizedPrompt,
  createQuestionFingerprint,
  calculateQuestionSimilarity,
  checkDuplicateQuestion
};
