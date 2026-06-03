import { readFileSync } from 'node:fs';

export const DEFAULT_SEED_PATH = 'shared-content/seed/questions.seed.json';

const VALID_WORLDS = new Set(['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting', 'phonology', 'readiness', 'emotions', 'instructions']);
const VALID_SKILLS = new Set(['letters', 'initial-sound', 'phonemic-awareness', 'rhyming', 'numbers', 'counting', 'shapes', 'colors', 'matching', 'memory', 'categories', 'sequences', 'emotions', 'first-grade-readiness', 'short-words', 'simple-instructions']);
const VALID_AGE_RANGES = new Set(['3-4', '4-5', '5-6']);
const VALID_DIFFICULTIES = new Set([1, 2, 3, 4, 5]);
const VALID_STATUSES = new Set(['draft', 'pending_review', 'approved', 'rejected', 'needs_changes', 'archived']);
const VALID_QUESTION_TYPES = new Set(['single-choice', 'image-choice', 'audio-choice', 'matching', 'sequence', 'memory', 'word-building', 'category', 'emotion']);
const SAFETY_TERMS = ['אלימות', 'פחד', 'מפחיד', 'בושה', 'השפלה', 'פוליטי', 'בחירות', 'דת', 'מלחמה', 'נשק', 'דם', 'עונש', 'טיפש'];

const FINAL_LETTER_MAP = new Map([
  ['ך', 'כ'],
  ['ם', 'מ'],
  ['ן', 'נ'],
  ['ף', 'פ'],
  ['ץ', 'צ']
]);

export function readSeedQuestions(seedPath = DEFAULT_SEED_PATH) {
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  if (!Array.isArray(seed.questions)) {
    throw new Error(`${seedPath} must include a questions array.`);
  }
  return seed.questions;
}

export function normalizeHebrewText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[ךםןףץ]/g, (letter) => FINAL_LETTER_MAP.get(letter) ?? letter)
    .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function hasHebrewText(value) {
  return /[\u0590-\u05FF]/.test(String(value ?? ''));
}

function levenshteinDistance(left, right) {
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

function levenshteinSimilarity(left, right) {
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  return 1 - levenshteinDistance(left, right) / maxLength;
}

function tokenOverlap(left, right) {
  const leftTokens = new Set(left.split(' ').filter(Boolean));
  const rightTokens = new Set(right.split(' ').filter(Boolean));
  if (!leftTokens.size && !rightTokens.size) return 1;
  if (!leftTokens.size || !rightTokens.size) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return intersection / union;
}

function optionOverlap(question, candidate) {
  const questionOptions = new Set(question.options.map((option) => normalizeHebrewText(option.text)));
  const candidateOptions = new Set(candidate.options.map((option) => normalizeHebrewText(option.text)));
  const intersection = [...questionOptions].filter((option) => candidateOptions.has(option)).length;
  const union = new Set([...questionOptions, ...candidateOptions]).size;
  return union ? intersection / union : 0;
}

export function calculateSimilarity(question, candidate) {
  const prompt = normalizeHebrewText(question.prompt);
  const candidatePrompt = normalizeHebrewText(candidate.prompt);
  const promptScore = Math.max(levenshteinSimilarity(prompt, candidatePrompt), tokenOverlap(prompt, candidatePrompt));
  const sameSkill = question.skillId === candidate.skillId ? 0.08 : 0;
  const sameWorld = question.worldId === candidate.worldId ? 0.05 : 0;
  const sameAge = question.ageRange === candidate.ageRange ? 0.04 : 0;
  const correctAnswer = normalizeHebrewText(question.options.find((option) => option.id === question.correctOptionId)?.text ?? '');
  const candidateCorrectAnswer = normalizeHebrewText(candidate.options.find((option) => option.id === candidate.correctOptionId)?.text ?? '');
  const sameCorrectAnswer = correctAnswer === candidateCorrectAnswer;
  const rawScore = promptScore * 0.66 + optionOverlap(question, candidate) * 0.13 + sameSkill + sameWorld + sameAge + (sameCorrectAnswer ? 0.08 : 0);
  return Math.min(1, sameCorrectAnswer ? rawScore : rawScore * 0.88);
}

export function checkDuplicateQuestion(question, existingQuestions) {
  let bestScore = 0;
  const matchedQuestionIds = [];

  for (const candidate of existingQuestions) {
    if (candidate.id === question.id) continue;
    const score = calculateSimilarity(question, candidate);
    if (score > bestScore) bestScore = score;
    if (score >= 0.78) matchedQuestionIds.push(candidate.id);
  }

  return {
    isDuplicate: bestScore >= 0.92,
    isSimilar: bestScore >= 0.78 && bestScore < 0.92,
    similarityScore: Number(bestScore.toFixed(3)),
    matchedQuestionIds,
    reason: bestScore >= 0.92
      ? 'duplicate'
      : bestScore >= 0.78
        ? 'similar'
        : undefined
  };
}

export function checkDuplicateQuestions(questions) {
  const matches = [];
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const duplicate = checkDuplicateQuestion(question, questions.slice(0, index));
    if (duplicate.isDuplicate || duplicate.isSimilar) {
      matches.push({ questionId: question.id, ...duplicate });
    }
  }
  return matches;
}

export function validateQuestions(questions) {
  const errors = [];
  const ids = new Set();

  questions.forEach((question, index) => {
    const label = question.id || `index:${index}`;
    if (!question.id || typeof question.id !== 'string') errors.push(`${label}: missing id`);
    if (ids.has(question.id)) errors.push(`${label}: duplicate id`);
    ids.add(question.id);
    if (!question.prompt || !hasHebrewText(question.prompt)) errors.push(`${label}: prompt must contain Hebrew text`);
    if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`${label}: at least two options are required`);
    if (!question.options?.some((option) => option.id === question.correctOptionId)) errors.push(`${label}: correctOptionId must match an option`);
    if (!VALID_WORLDS.has(question.worldId)) errors.push(`${label}: invalid worldId`);
    if (!VALID_SKILLS.has(question.skillId)) errors.push(`${label}: invalid skillId`);
    if (!VALID_AGE_RANGES.has(question.ageRange)) errors.push(`${label}: invalid ageRange`);
    if (!VALID_DIFFICULTIES.has(question.difficulty)) errors.push(`${label}: invalid difficulty`);
    if (!VALID_STATUSES.has(question.status)) errors.push(`${label}: invalid status`);
    if (!VALID_QUESTION_TYPES.has(question.questionType)) errors.push(`${label}: invalid questionType`);
    if (!question.hint?.trim()) errors.push(`${label}: missing hint`);
    if (!question.explanationForParent?.trim()) errors.push(`${label}: missing explanationForParent`);
    if (!question.pedagogicalGoal?.trim()) errors.push(`${label}: missing pedagogicalGoal`);
    if (question.options?.some((option) => !option.id?.trim() || !option.text?.trim())) errors.push(`${label}: empty option id/text`);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

function issue(severity, field, message, suggestion) {
  return { severity, field, message, suggestion };
}

export function reviewQuestionContent(question) {
  const issues = [];
  if (!question.options?.some((option) => option.id === question.correctOptionId)) {
    issues.push(issue('critical', 'correctOptionId', 'Correct answer is missing.'));
  }
  if (question.options?.length < 2) issues.push(issue('critical', 'options', 'At least two options are required.'));
  if (question.ageRange === '3-4' && question.prompt.length > 72) {
    issues.push(issue('warning', 'prompt', 'Prompt is too long for ages 3-4.', 'Shorten the prompt.'));
  }
  if (!hasHebrewText(question.prompt)) issues.push(issue('critical', 'prompt', 'Prompt must be Hebrew.'));
  if (!question.hint?.trim()) issues.push(issue('warning', 'hint', 'Missing hint.', 'Add a short hint.'));
  if (!question.explanationForParent?.trim()) issues.push(issue('warning', 'explanationForParent', 'Missing parent explanation.', 'Add a short explanation.'));

  const normalizedText = normalizeHebrewText([
    question.prompt,
    question.hint,
    question.explanationForParent,
    question.pedagogicalGoal,
    ...(question.options ?? []).map((option) => option.text)
  ].join(' '));
  const unsafeTerms = SAFETY_TERMS.filter((term) => normalizedText.includes(normalizeHebrewText(term)));
  if (unsafeTerms.length) issues.push(issue('critical', 'safety', `Unsafe terms: ${unsafeTerms.join(', ')}`));

  const safetyScore = unsafeTerms.length ? 70 : 100;
  const clarityScore = Math.max(0, 100 - issues.filter((item) => ['prompt', 'options', 'correctOptionId'].includes(item.field)).length * 24);
  const languageScore = hasHebrewText(question.prompt) ? 96 : 40;
  const ageFitScore = question.ageRange === '3-4' && question.prompt.length > 72 ? 78 : 96;
  const pedagogyScore = question.pedagogicalGoal?.trim() && question.hint?.trim() ? 94 : 78;
  const diversityScore = question.tags?.length >= 2 ? 92 : 82;
  const accessibilityScore = question.audioText?.trim() && question.hint?.trim() ? 94 : 82;
  const overallScore = Math.round((safetyScore * 0.2) + (clarityScore * 0.18) + (languageScore * 0.14) + (ageFitScore * 0.16) + (pedagogyScore * 0.16) + (diversityScore * 0.08) + (accessibilityScore * 0.08));
  const hasCritical = issues.some((item) => item.severity === 'critical');
  const approved = !hasCritical && safetyScore >= 95 && overallScore >= 88;

  return {
    approved,
    status: approved ? 'approved' : hasCritical ? 'rejected' : 'needs_changes',
    overallScore,
    ageFitScore,
    clarityScore,
    languageScore,
    pedagogyScore,
    safetyScore,
    diversityScore,
    accessibilityScore,
    reviewerRoles: [],
    issues,
    suggestions: [...new Set(issues.map((item) => item.suggestion).filter(Boolean))],
    finalRecommendation: approved ? 'Approved for publication.' : hasCritical ? 'Reject until critical issues are fixed.' : 'Needs manual review.'
  };
}

export function reviewQuestions(questions) {
  return questions.map((question) => ({
    id: question.id,
    review: reviewQuestionContent(question)
  }));
}
