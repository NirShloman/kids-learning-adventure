import { FormEvent, useMemo, useState } from 'react';
import {
  AgeRange,
  DuplicateCheckResult,
  GameOption,
  GameQuestion,
  LearningWorldId,
  QuestionDifficulty,
  QuestionReviewReport,
  QuestionType,
  SkillId
} from '../../types';
import { Button } from '../common/Button';
import { checkDuplicateQuestion, normalizeHebrewText } from '../../services/contentReview/duplicateQuestionDetector';
import { reviewQuestionContent } from '../../services/contentReview/contentReviewAgent';
import { submitQuestionForReview } from '../../services/firebase/questionRepository';
import { DuplicateWarning } from './DuplicateWarning';
import { ReviewScoreCard } from './ReviewScoreCard';

interface QuestionSubmissionFormProps {
  existingQuestions: GameQuestion[];
  onSubmitted: (question: GameQuestion) => void;
}

const worldOptions: LearningWorldId[] = ['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting', 'emotions', 'instructions', 'readiness'];
const skillOptions: SkillId[] = [
  'letters',
  'initial-sound',
  'phonemic-awareness',
  'rhyming',
  'numbers',
  'counting',
  'shapes',
  'colors',
  'matching',
  'memory',
  'categories',
  'sequences',
  'emotions',
  'first-grade-readiness',
  'short-words',
  'simple-instructions'
];
const ageRanges: AgeRange[] = ['3-4', '4-5', '5-6'];
const difficulties: QuestionDifficulty[] = [1, 2, 3, 4, 5];
const questionTypes: QuestionType[] = ['single-choice', 'image-choice', 'audio-choice', 'matching', 'sequence', 'memory', 'word-building', 'category', 'emotion'];

function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

function createQuestionId(prompt: string): string {
  const normalized = normalizeHebrewText(prompt).replace(/\s+/g, '-').slice(0, 36);
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : String(Date.now()).slice(-8);
  return `submission-${normalized || 'question'}-${suffix}`;
}

function emptyOption(id: string): GameOption {
  return { id, text: '' };
}

export function QuestionSubmissionForm({ existingQuestions, onSubmitted }: QuestionSubmissionFormProps) {
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<GameOption[]>([emptyOption('a'), emptyOption('b'), emptyOption('c')]);
  const [correctOptionId, setCorrectOptionId] = useState('a');
  const [worldId, setWorldId] = useState<LearningWorldId>('letters');
  const [skillId, setSkillId] = useState<SkillId>('letters');
  const [ageRange, setAgeRange] = useState<AgeRange>('4-5');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(2);
  const [questionType, setQuestionType] = useState<QuestionType>('single-choice');
  const [hint, setHint] = useState('');
  const [explanationForParent, setExplanationForParent] = useState('');
  const [tags, setTags] = useState('');
  const [pedagogicalGoal, setPedagogicalGoal] = useState('');
  const [duplicate, setDuplicate] = useState<DuplicateCheckResult | undefined>();
  const [review, setReview] = useState<QuestionReviewReport | undefined>();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canRunChecks = useMemo(() => (
    prompt.trim().length >= 4 &&
    options.filter((option) => option.text.trim()).length >= 2 &&
    correctOptionId.trim().length > 0
  ), [correctOptionId, options, prompt]);

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => (
      optionIndex === index ? { ...option, text: value } : option
    )));
  }

  function addOption() {
    if (options.length >= 4) return;
    const nextId = String.fromCharCode(97 + options.length);
    setOptions((current) => [...current, emptyOption(nextId)]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    const removedId = options[index]?.id;
    const nextOptions = options.filter((_, optionIndex) => optionIndex !== index);
    setOptions(nextOptions);
    if (removedId === correctOptionId) setCorrectOptionId(nextOptions[0]?.id ?? 'a');
  }

  function buildQuestion(): GameQuestion {
    const createdAt = new Date().toISOString();
    const cleanOptions = options
      .map((option) => ({ ...option, text: sanitizeText(option.text) }))
      .filter((option) => option.text);

    return {
      id: createQuestionId(prompt),
      prompt: sanitizeText(prompt),
      options: cleanOptions,
      correctOptionId,
      worldId,
      skillId,
      ageRange,
      difficulty,
      questionType,
      language: 'he',
      tags: tags.split(',').map(sanitizeText).filter(Boolean),
      estimatedTimeSeconds: ageRange === '3-4' ? 18 : ageRange === '4-5' ? 24 : 30,
      pedagogicalGoal: sanitizeText(pedagogicalGoal),
      explanationForParent: sanitizeText(explanationForParent),
      hint: sanitizeText(hint),
      audioText: sanitizeText(prompt),
      status: 'pending_review',
      createdBy: 'content_editor',
      createdAt,
      updatedAt: createdAt,
      version: 1
    };
  }

  function runChecks(): GameQuestion {
    const question = buildQuestion();
    const duplicateResult = checkDuplicateQuestion(question, existingQuestions);
    const reviewResult = reviewQuestionContent({ ...question, duplicate: duplicateResult });
    setDuplicate(duplicateResult);
    setReview(reviewResult);
    setMessage(reviewResult.approved ? 'הבדיקה עברה. השאלה תישמר כממתינה לאישור.' : 'נמצאו הערות. אפשר עדיין לשמור למסלול בדיקה, לא למאגר המאושר.');
    return { ...question, duplicate: duplicateResult, review: reviewResult };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRunChecks || isSubmitting) return;

    setIsSubmitting(true);
    setMessage('שולחים לבדיקה...');

    try {
      const checkedQuestion = runChecks();
      const savedQuestion = await submitQuestionForReview(checkedQuestion);
      onSubmitted(savedQuestion);
      setMessage('השאלה נשמרה במסלול בדיקה ואינה מוצגת לילדים.');
    } catch {
      setMessage('השמירה ל-Firebase נכשלה. ודאו שהסביבה מוגדרת ושיש הרשאות Admin מתאימות.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form__grid">
        <label>
          <span>שאלה</span>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} required />
        </label>

        <label>
          <span>מטרה פדגוגית</span>
          <input value={pedagogicalGoal} onChange={(event) => setPedagogicalGoal(event.target.value)} required />
        </label>

        <label>
          <span>עולם</span>
          <select value={worldId} onChange={(event) => setWorldId(event.target.value as LearningWorldId)}>
            {worldOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>מיומנות</span>
          <select value={skillId} onChange={(event) => setSkillId(event.target.value as SkillId)}>
            {skillOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>גיל</span>
          <select value={ageRange} onChange={(event) => setAgeRange(event.target.value as AgeRange)}>
            {ageRanges.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>רמת קושי</span>
          <select value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value) as QuestionDifficulty)}>
            {difficulties.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>סוג שאלה</span>
          <select value={questionType} onChange={(event) => setQuestionType(event.target.value as QuestionType)}>
            {questionTypes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <label>
          <span>תגיות מופרדות בפסיק</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
      </div>

      <div className="admin-options-editor">
        <div className="admin-options-editor__header">
          <h3>תשובות</h3>
          <Button type="button" variant="secondary" onClick={addOption} disabled={options.length >= 4}>הוספת תשובה</Button>
        </div>
        {options.map((option, index) => (
          <div className="admin-option-row" key={option.id}>
            <input type="radio" name="correctOption" checked={correctOptionId === option.id} onChange={() => setCorrectOptionId(option.id)} aria-label="תשובה נכונה" />
            <input value={option.text} onChange={(event) => updateOption(index, event.target.value)} placeholder={`תשובה ${index + 1}`} required={index < 2} />
            <Button type="button" variant="ghost" onClick={() => removeOption(index)} disabled={options.length <= 2}>הסרה</Button>
          </div>
        ))}
      </div>

      <div className="admin-form__grid">
        <label>
          <span>רמז</span>
          <input value={hint} onChange={(event) => setHint(event.target.value)} />
        </label>
        <label>
          <span>הסבר להורה</span>
          <input value={explanationForParent} onChange={(event) => setExplanationForParent(event.target.value)} />
        </label>
      </div>

      <div className="admin-preflight">
        <DuplicateWarning duplicate={duplicate} />
        <ReviewScoreCard review={review} />
      </div>

      {message ? <p className="admin-message">{message}</p> : null}

      <div className="admin-form__actions">
        <Button type="button" variant="secondary" disabled={!canRunChecks} onClick={runChecks}>בדיקה לפני שמירה</Button>
        <Button type="submit" disabled={!canRunChecks || isSubmitting}>שליחה לבדיקה</Button>
      </div>
    </form>
  );
}
