import { useEffect, useMemo, useState } from 'react';
import { DuplicateWarning } from '../components/admin/DuplicateWarning';
import { QuestionReviewPanel } from '../components/admin/QuestionReviewPanel';
import { QuestionSubmissionForm } from '../components/admin/QuestionSubmissionForm';
import { ReviewScoreCard } from '../components/admin/ReviewScoreCard';
import { Button } from '../components/common/Button';
import {
  AgeRange,
  GameQuestion,
  LearningWorldId,
  QuestionDifficulty,
  QuestionStatus
} from '../types';
import {
  getPendingQuestions,
  getRejectedQuestions,
  importSeedQuestions,
  updateQuestionReviewStatus
} from '../services/firebase/questionRepository';
import {
  getApprovedGameQuestions,
  loadBundledGameQuestions
} from '../services/questions/questionProvider';

interface AdminPageProps {
  onBack: () => void;
}

type StatusFilter = 'all' | QuestionStatus;

const worldFilters: Array<'all' | LearningWorldId> = ['all', 'letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting', 'emotions', 'instructions', 'readiness'];
const ageFilters: Array<'all' | AgeRange> = ['all', '3-4', '4-5', '5-6'];
const difficultyFilters: Array<'all' | QuestionDifficulty> = ['all', 1, 2, 3, 4, 5];
const statusFilters: StatusFilter[] = ['all', 'approved', 'pending_review', 'needs_changes', 'rejected', 'archived'];

function dedupeQuestions(questions: GameQuestion[]): GameQuestion[] {
  return [...new Map(questions.map((question) => [question.id, question])).values()];
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

export function AdminPage({ onBack }: AdminPageProps) {
  const [approvedQuestions, setApprovedQuestions] = useState<GameQuestion[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<GameQuestion[]>([]);
  const [rejectedQuestions, setRejectedQuestions] = useState<GameQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [worldFilter, setWorldFilter] = useState<'all' | LearningWorldId>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | AgeRange>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | QuestionDifficulty>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('טוענים מאגר שאלות...');
  const [isBusy, setIsBusy] = useState(false);

  const allQuestions = useMemo(() => dedupeQuestions([
    ...pendingQuestions,
    ...rejectedQuestions,
    ...approvedQuestions
  ]), [approvedQuestions, pendingQuestions, rejectedQuestions]);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allQuestions.filter((question) => {
      if (worldFilter !== 'all' && question.worldId !== worldFilter) return false;
      if (ageFilter !== 'all' && question.ageRange !== ageFilter) return false;
      if (difficultyFilter !== 'all' && question.difficulty !== difficultyFilter) return false;
      if (statusFilter !== 'all' && question.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      return [
        question.id,
        question.prompt,
        question.skillId,
        question.tags.join(' ')
      ].join(' ').toLowerCase().includes(normalizedSearch);
    });
  }, [ageFilter, allQuestions, difficultyFilter, search, statusFilter, worldFilter]);

  const selectedQuestion = allQuestions.find((question) => question.id === selectedQuestionId) ?? filteredQuestions[0] ?? null;

  async function loadAdminData() {
    setIsBusy(true);
    setMessage('טוענים שאלות...');

    try {
      const [approved, pending, rejected] = await Promise.all([
        getApprovedGameQuestions(),
        getPendingQuestions(),
        getRejectedQuestions()
      ]);
      setApprovedQuestions(approved);
      setPendingQuestions(pending);
      setRejectedQuestions(rejected);
      setSelectedQuestionId((current) => current || pending[0]?.id || approved[0]?.id || '');
      setMessage('מאגר השאלות נטען.');
    } catch {
      setMessage('טעינת Firebase נכשלה. מוצג תוכן מקומי אם קיים.');
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function handleSubmitted(question: GameQuestion) {
    if (question.status === 'rejected') {
      setRejectedQuestions((current) => dedupeQuestions([question, ...current]));
    } else {
      setPendingQuestions((current) => dedupeQuestions([question, ...current]));
    }
    setSelectedQuestionId(question.id);
  }

  async function handleStatusChange(
    questionId: string,
    status: Extract<QuestionStatus, 'approved' | 'rejected' | 'needs_changes' | 'archived'>,
    updates: Partial<GameQuestion> = {}
  ) {
    setIsBusy(true);
    setMessage('שומרים שינוי סטטוס...');

    try {
      const updatedQuestion = await updateQuestionReviewStatus(questionId, status, updates);
      setApprovedQuestions((current) => dedupeQuestions(status === 'approved' || status === 'archived'
        ? [updatedQuestion, ...current.filter((question) => question.id !== questionId)]
        : current.filter((question) => question.id !== questionId)));
      setPendingQuestions((current) => dedupeQuestions(status === 'needs_changes'
        ? [updatedQuestion, ...current.filter((question) => question.id !== questionId)]
        : current.filter((question) => question.id !== questionId)));
      setRejectedQuestions((current) => dedupeQuestions(status === 'rejected'
        ? [updatedQuestion, ...current.filter((question) => question.id !== questionId)]
        : current.filter((question) => question.id !== questionId)));
      setSelectedQuestionId(updatedQuestion.id);
      setMessage(`השאלה סומנה כ-${statusLabel(status)}.`);
    } catch {
      setMessage('שמירה ל-Firebase נכשלה. בדקו הרשאות Admin ו-Firestore rules.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImportSeed() {
    setIsBusy(true);
    setMessage('מייבאים seed ראשוני...');

    try {
      const seedQuestions = (await loadBundledGameQuestions()).slice(0, 120);
      const summary = await importSeedQuestions(seedQuestions);
      setMessage(`ייבוא הסתיים: ${summary.imported} אושרו, ${summary.rejected} נדחו, ${summary.similar} דומות.`);
      await loadAdminData();
    } catch {
      setMessage('ייבוא seed נכשל. פעולה זו דורשת Firebase מוגדר והרשאות Admin.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleExportJson() {
    const questions = await getApprovedGameQuestions();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), questions }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `questions-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('גיבוי JSON נוצר בדפדפן.');
  }

  return (
    <section className="admin-page" dir="rtl">
      <div className="admin-page__header">
        <div>
          <span className="question-card__tag">Admin</span>
          <h2>ניהול מאגר שאלות</h2>
          <p>אישור, בדיקה, סינון וייבוא תוכן לימודי לפני שהוא מופיע במשחקים.</p>
        </div>
        <div className="admin-page__actions">
          <Button type="button" variant="secondary" onClick={handleImportSeed} disabled={isBusy}>Import Seed</Button>
          <Button type="button" variant="secondary" onClick={handleExportJson}>Export JSON</Button>
          <Button type="button" variant="ghost" onClick={onBack}>חזרה</Button>
        </div>
      </div>

      <div className="admin-stats">
        <div><strong>{allQuestions.length}</strong><span>סה״כ</span></div>
        <div><strong>{approvedQuestions.filter((question) => question.status === 'approved').length}</strong><span>מאושרות</span></div>
        <div><strong>{pendingQuestions.length}</strong><span>ממתינות</span></div>
        <div><strong>{rejectedQuestions.length}</strong><span>דחויות</span></div>
      </div>

      <div className="admin-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש שאלה" />
        <select value={worldFilter} onChange={(event) => setWorldFilter(event.target.value as 'all' | LearningWorldId)}>
          {worldFilters.map((option) => <option key={option} value={option}>{option === 'all' ? 'כל העולמות' : option}</option>)}
        </select>
        <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value as 'all' | AgeRange)}>
          {ageFilters.map((option) => <option key={option} value={option}>{option === 'all' ? 'כל הגילאים' : option}</option>)}
        </select>
        <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(optionValue(event.target.value))}>
          {difficultyFilters.map((option) => <option key={option} value={option}>{option === 'all' ? 'כל הרמות' : option}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
          {statusFilters.map((option) => <option key={option} value={option}>{option === 'all' ? 'כל הסטטוסים' : statusLabel(option)}</option>)}
        </select>
      </div>

      {message ? <p className="admin-message">{message}</p> : null}

      <div className="admin-layout">
        <section className="admin-list">
          {filteredQuestions.slice(0, 120).map((question) => (
            <button
              key={question.id}
              type="button"
              className={question.id === selectedQuestion?.id ? 'admin-list-item admin-list-item--active' : 'admin-list-item'}
              onClick={() => setSelectedQuestionId(question.id)}
            >
              <span className={`admin-status admin-status--${question.status}`}>{statusLabel(question.status)}</span>
              <strong>{question.prompt}</strong>
              <small>{question.worldId} · {question.ageRange} · קושי {question.difficulty}</small>
            </button>
          ))}
        </section>

        <QuestionReviewPanel question={selectedQuestion} onStatusChange={handleStatusChange} />
      </div>

      <section className="admin-submission-section">
        <div className="admin-submission-section__intro">
          <h2>הוספת שאלה לבדיקה</h2>
          <p>השאלה תעבור סניטציה, בדיקת כפילות ו-Agent לפני שמירה במסלול ממתינות.</p>
        </div>
        <QuestionSubmissionForm existingQuestions={allQuestions} onSubmitted={handleSubmitted} />
      </section>

      <div className="admin-diagnostics">
        <DuplicateWarning duplicate={selectedQuestion?.duplicate} />
        <ReviewScoreCard review={selectedQuestion?.review} />
      </div>
    </section>
  );
}

function optionValue(value: string): 'all' | QuestionDifficulty {
  return value === 'all' ? 'all' : Number(value) as QuestionDifficulty;
}
