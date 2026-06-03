import { useEffect, useState } from 'react';
import { GameQuestion, QuestionStatus } from '../../types';
import { Button } from '../common/Button';
import { DuplicateWarning } from './DuplicateWarning';
import { ReviewScoreCard } from './ReviewScoreCard';

interface QuestionReviewPanelProps {
  question: GameQuestion | null;
  onStatusChange: (
    questionId: string,
    status: Extract<QuestionStatus, 'approved' | 'rejected' | 'needs_changes' | 'archived'>,
    updates?: Partial<GameQuestion>
  ) => void;
}

function statusLabel(status: QuestionStatus): string {
  const labels: Record<QuestionStatus, string> = {
    draft: 'טיוטה',
    pending_review: 'ממתינה',
    approved: 'מאושרת',
    rejected: 'נדחתה',
    needs_changes: 'דורשת תיקון',
    archived: 'בארכיון'
  };
  return labels[status];
}

function editableStatus(status: QuestionStatus): Extract<QuestionStatus, 'approved' | 'rejected' | 'needs_changes' | 'archived'> {
  if (status === 'approved' || status === 'rejected' || status === 'archived') return status;
  return 'needs_changes';
}

export function QuestionReviewPanel({ question, onStatusChange }: QuestionReviewPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [hint, setHint] = useState('');
  const [explanationForParent, setExplanationForParent] = useState('');

  useEffect(() => {
    setPrompt(question?.prompt ?? '');
    setHint(question?.hint ?? '');
    setExplanationForParent(question?.explanationForParent ?? '');
  }, [question]);

  if (!question) {
    return (
      <section className="admin-review-panel">
        <h2>בחרו שאלה לבדיקה</h2>
        <p>שאלות ממתינות, דחויות ומאושרות יופיעו כאן לפי הסינון.</p>
      </section>
    );
  }

  const editedFields: Partial<GameQuestion> = {
    prompt,
    hint,
    explanationForParent,
    audioText: prompt
  };

  return (
    <section className="admin-review-panel">
      <div className="admin-review-panel__top">
        <div>
          <span className={`admin-status admin-status--${question.status}`}>{statusLabel(question.status)}</span>
          <h2>{question.id}</h2>
          <p>{question.worldId} · {question.skillId} · גיל {question.ageRange} · קושי {question.difficulty}</p>
        </div>
      </div>

      <div className="admin-preview">
        <span className="question-card__tag">Preview</span>
        <h3>{prompt}</h3>
        <div className="admin-preview__options">
          {question.options.map((option) => (
            <span key={option.id} className={option.id === question.correctOptionId ? 'admin-preview__option admin-preview__option--correct' : 'admin-preview__option'}>
              {option.text}
            </span>
          ))}
        </div>
      </div>

      <div className="admin-edit-grid">
        <label>
          <span>עריכת שאלה</span>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} />
        </label>
        <label>
          <span>רמז</span>
          <input value={hint} onChange={(event) => setHint(event.target.value)} />
        </label>
        <label>
          <span>הסבר להורה</span>
          <input value={explanationForParent} onChange={(event) => setExplanationForParent(event.target.value)} />
        </label>
      </div>

      <div className="admin-review-panel__actions">
        <Button type="button" variant="secondary" onClick={() => onStatusChange(question.id, editableStatus(question.status), editedFields)}>
          שמירת עריכה
        </Button>
        <Button type="button" onClick={() => onStatusChange(question.id, 'approved', editedFields)}>
          אישור
        </Button>
        <Button type="button" variant="secondary" onClick={() => onStatusChange(question.id, 'needs_changes', editedFields)}>
          בקשת תיקון
        </Button>
        <Button type="button" variant="ghost" onClick={() => onStatusChange(question.id, 'rejected', editedFields)}>
          דחייה
        </Button>
        <Button type="button" variant="ghost" onClick={() => onStatusChange(question.id, 'archived', editedFields)}>
          ארכיון
        </Button>
      </div>

      <div className="admin-preflight">
        <DuplicateWarning duplicate={question.duplicate} />
        <ReviewScoreCard review={question.review} />
      </div>
    </section>
  );
}
