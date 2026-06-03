import {
  AgeRange,
  GameQuestion,
  QuestionDifficulty,
  QuestionReviewReport,
  ReviewIssue,
  ReviewRole,
  ReviewRoleReport
} from '../../types';
import { normalizeHebrewText } from './duplicateQuestionDetector';

const MAX_PROMPT_LENGTH_BY_AGE: Record<AgeRange, number> = {
  '3-4': 72,
  '4-5': 96,
  '5-6': 128
};

const MAX_OPTION_LENGTH_BY_AGE: Record<AgeRange, number> = {
  '3-4': 24,
  '4-5': 34,
  '5-6': 44
};

const DIFFICULTY_BY_AGE: Record<AgeRange, QuestionDifficulty[]> = {
  '3-4': [1, 2],
  '4-5': [2, 3, 4],
  '5-6': [3, 4, 5]
};

const SAFETY_TERMS = [
  'אלימות',
  'פחד',
  'מפחיד',
  'בושה',
  'השפלה',
  'פוליטי',
  'בחירות',
  'דת',
  'מלחמה',
  'נשק',
  'דם',
  'עונש',
  'טיפש'
];

const ROLES: ReviewRole[] = [
  'speech_language_pathologist',
  'early_childhood_teacher',
  'first_grade_readiness_teacher',
  'accessibility_specialist',
  'child_safety_reviewer',
  'hebrew_content_editor'
];

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasHebrewText(value: string): boolean {
  return /[\u0590-\u05FF]/.test(value);
}

function hasVisualSupport(question: GameQuestion): boolean {
  return Boolean(question.media?.imageUrl || question.media?.illustrationKey || question.options.some((option) => option.media?.imageUrl || option.media?.illustrationKey));
}

function uniqueNormalizedValues(values: string[]): Set<string> {
  return new Set(values.map((value) => normalizeHebrewText(value)).filter(Boolean));
}

function addIssue(issues: ReviewIssue[], severity: ReviewIssue['severity'], field: string, message: string, suggestion?: string): void {
  issues.push({ severity, field, message, suggestion });
}

function scoreFromIssues(
  issues: ReviewIssue[],
  fields: string[],
  baseScore = 100
): number {
  const penalties = issues
    .filter((issue) => fields.includes(issue.field))
    .reduce((sum, issue) => {
      if (issue.severity === 'critical') return sum + 42;
      if (issue.severity === 'warning') return sum + 15;
      return sum + 5;
    }, 0);

  return clampScore(baseScore - penalties);
}

function reviewRequiredFields(question: GameQuestion, issues: ReviewIssue[]): void {
  if (!question.id.trim()) addIssue(issues, 'critical', 'id', 'Missing question id.');
  if (!question.prompt.trim()) addIssue(issues, 'critical', 'prompt', 'Missing prompt.');
  if (!question.worldId) addIssue(issues, 'critical', 'worldId', 'Missing world id.');
  if (!question.skillId) addIssue(issues, 'critical', 'skillId', 'Missing skill id.');
  if (!question.pedagogicalGoal.trim()) addIssue(issues, 'warning', 'pedagogicalGoal', 'Missing pedagogical goal.', 'Add the exact skill this question practices.');
  if (!question.hint?.trim()) addIssue(issues, 'warning', 'hint', 'Missing child-friendly hint.', 'Add one short hint that does not reveal the answer.');
  if (!question.explanationForParent?.trim()) addIssue(issues, 'warning', 'explanationForParent', 'Missing parent explanation.', 'Add a short parent-facing explanation.');
  if (question.language !== 'he') addIssue(issues, 'critical', 'language', 'Question language must be Hebrew.');
}

function reviewOptions(question: GameQuestion, issues: ReviewIssue[]): void {
  if (question.options.length < 2) {
    addIssue(issues, 'critical', 'options', 'Question has fewer than two options.', 'Add at least two answer options.');
    return;
  }

  if (question.options.length < 3) {
    addIssue(issues, 'warning', 'options', 'Question should usually include three or four options.', 'Add one more reasonable distractor.');
  }

  if (!question.options.some((option) => option.id === question.correctOptionId)) {
    addIssue(issues, 'critical', 'correctOptionId', 'Correct option id does not exist in options.');
  }

  if (question.options.some((option) => !option.id.trim() || !option.text.trim())) {
    addIssue(issues, 'critical', 'options', 'Every option must have an id and text.');
  }

  if (uniqueNormalizedValues(question.options.map((option) => option.id)).size !== question.options.length) {
    addIssue(issues, 'critical', 'options', 'Duplicate option ids found.');
  }

  if (uniqueNormalizedValues(question.options.map((option) => option.text)).size !== question.options.length) {
    addIssue(issues, 'warning', 'options', 'Similar or duplicate option text found.', 'Make each distractor clearly different.');
  }

  if (question.options.some((option) => option.text.length > MAX_OPTION_LENGTH_BY_AGE[question.ageRange])) {
    addIssue(issues, 'warning', 'options', 'One or more options are too long for the selected age range.', 'Shorten answer choices.');
  }
}

function reviewAgeAndDifficulty(question: GameQuestion, issues: ReviewIssue[]): void {
  if (!DIFFICULTY_BY_AGE[question.ageRange].includes(question.difficulty)) {
    addIssue(
      issues,
      'warning',
      'difficulty',
      'Difficulty does not fit the selected age range.',
      'Adjust age range or difficulty so the challenge is developmentally appropriate.'
    );
  }

  if (question.ageRange === '3-4' && question.prompt.length > MAX_PROMPT_LENGTH_BY_AGE[question.ageRange]) {
    addIssue(issues, 'warning', 'prompt', 'Prompt is too long for ages 3-4.', 'Use a shorter prompt with concrete words.');
  } else if (question.prompt.length > MAX_PROMPT_LENGTH_BY_AGE[question.ageRange]) {
    addIssue(issues, 'warning', 'prompt', 'Prompt is longer than recommended for the selected age range.', 'Shorten the prompt.');
  }

  if (question.ageRange === '3-4' && !hasVisualSupport(question)) {
    addIssue(issues, 'warning', 'media', 'Ages 3-4 benefit from visual support.', 'Add an illustration key or option images when possible.');
  }
}

function reviewLanguage(question: GameQuestion, issues: ReviewIssue[]): void {
  const allText = [
    question.prompt,
    question.audioText ?? '',
    question.hint ?? '',
    question.explanationForParent ?? '',
    question.pedagogicalGoal,
    ...question.options.map((option) => option.text)
  ].join(' ');

  if (!hasHebrewText(question.prompt)) {
    addIssue(issues, 'critical', 'prompt', 'Prompt must contain Hebrew text.');
  }

  if (/[!?]{2,}/.test(allText)) {
    addIssue(issues, 'warning', 'language', 'Avoid repeated punctuation that can feel loud or confusing.');
  }

  if (question.audioText && question.audioText.length > question.prompt.length + 80) {
    addIssue(issues, 'warning', 'audioText', 'Audio text is much longer than the visible prompt.', 'Keep read-aloud text concise.');
  }
}

function reviewSafety(question: GameQuestion, issues: ReviewIssue[]): void {
  const normalizedText = normalizeHebrewText([
    question.prompt,
    question.hint ?? '',
    question.explanationForParent ?? '',
    question.pedagogicalGoal,
    ...question.options.map((option) => option.text)
  ].join(' '));

  const matchedTerms = SAFETY_TERMS.filter((term) => normalizedText.includes(normalizeHebrewText(term)));
  if (matchedTerms.length) {
    addIssue(
      issues,
      'critical',
      'safety',
      `Potentially unsafe or sensitive child content found: ${matchedTerms.join(', ')}.`,
      'Rewrite with neutral, age-appropriate language.'
    );
  }

  if (question.prompt.includes('לא נכון') || question.prompt.includes('נכשל')) {
    addIssue(issues, 'warning', 'safety', 'Avoid shame-oriented wording.', 'Use encouraging, neutral phrasing.');
  }
}

function reviewDuplicateResult(question: GameQuestion, issues: ReviewIssue[]): void {
  if (!question.duplicate) return;

  if (question.duplicate.isDuplicate) {
    addIssue(issues, 'critical', 'duplicate', 'Question is a duplicate of existing content.', 'Do not approve duplicate content.');
  } else if (question.duplicate.isSimilar) {
    addIssue(issues, 'warning', 'duplicate', 'Question is similar to existing content.', 'Review manually before approval.');
  }
}

function createRoleReports(
  scores: Pick<QuestionReviewReport, 'ageFitScore' | 'clarityScore' | 'languageScore' | 'pedagogyScore' | 'safetyScore' | 'accessibilityScore'>
): ReviewRoleReport[] {
  const roleScores: Record<ReviewRole, number> = {
    speech_language_pathologist: Math.round((scores.clarityScore + scores.languageScore) / 2),
    early_childhood_teacher: Math.round((scores.ageFitScore + scores.pedagogyScore) / 2),
    first_grade_readiness_teacher: Math.round((scores.ageFitScore + scores.pedagogyScore) / 2),
    accessibility_specialist: scores.accessibilityScore,
    child_safety_reviewer: scores.safetyScore,
    hebrew_content_editor: scores.languageScore
  };

  return ROLES.map((role) => ({
    role,
    score: roleScores[role],
    notes: roleScores[role] >= 90
      ? ['No blocking issue found for this role.']
      : ['Review recommended before approval.']
  }));
}

function createSuggestions(issues: ReviewIssue[]): string[] {
  const suggestions = issues
    .map((issue) => issue.suggestion)
    .filter((suggestion): suggestion is string => Boolean(suggestion));

  return suggestions.length ? [...new Set(suggestions)] : ['No changes required.'];
}

export function reviewQuestionContent(question: GameQuestion): QuestionReviewReport {
  const issues: ReviewIssue[] = [];

  reviewRequiredFields(question, issues);
  reviewOptions(question, issues);
  reviewAgeAndDifficulty(question, issues);
  reviewLanguage(question, issues);
  reviewSafety(question, issues);
  reviewDuplicateResult(question, issues);

  const ageFitScore = scoreFromIssues(issues, ['difficulty', 'prompt', 'media']);
  const clarityScore = scoreFromIssues(issues, ['prompt', 'options', 'correctOptionId', 'audioText']);
  const languageScore = scoreFromIssues(issues, ['language', 'prompt', 'audioText']);
  const pedagogyScore = scoreFromIssues(issues, ['skillId', 'worldId', 'pedagogicalGoal', 'hint', 'explanationForParent']);
  const safetyScore = scoreFromIssues(issues, ['safety'], 100);
  const diversityScore = clampScore(100 - (question.tags.length < 2 ? 10 : 0) - (question.questionType === 'single-choice' ? 3 : 0));
  const accessibilityScore = clampScore(100 - (!question.audioText?.trim() ? 10 : 0) - (!question.hint?.trim() ? 10 : 0));
  const overallScore = clampScore(
    ageFitScore * 0.16 +
    clarityScore * 0.18 +
    languageScore * 0.14 +
    pedagogyScore * 0.16 +
    safetyScore * 0.2 +
    diversityScore * 0.08 +
    accessibilityScore * 0.08
  );
  const hasCriticalIssue = issues.some((issue) => issue.severity === 'critical');
  const approved = !hasCriticalIssue && safetyScore >= 95 && overallScore >= 88;
  const status = approved ? 'approved' : hasCriticalIssue ? 'rejected' : 'needs_changes';

  return {
    approved,
    status,
    overallScore,
    ageFitScore,
    clarityScore,
    languageScore,
    pedagogyScore,
    safetyScore,
    diversityScore,
    accessibilityScore,
    reviewerRoles: createRoleReports({
      ageFitScore,
      clarityScore,
      languageScore,
      pedagogyScore,
      safetyScore,
      accessibilityScore
    }),
    issues,
    suggestions: createSuggestions(issues),
    finalRecommendation: approved
      ? 'Approved for publication.'
      : status === 'rejected'
        ? 'Reject until critical issues are fixed.'
        : 'Needs content edits and manual review.'
  };
}

export const contentReviewAgent = {
  reviewQuestionContent
};
