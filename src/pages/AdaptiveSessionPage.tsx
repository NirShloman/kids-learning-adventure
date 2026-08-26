import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import type { ContentItemBase, LearnerProfile, LearningContentDescriptor, SessionPlan } from '../types';
import { planAdaptiveSession } from '../learning/sessionPlanner';
import { loadGameContent, loadLearningContentIndex } from '../services/staticContentRepository';
import { getProfileData, recordLearningEvent, saveActivePlan, saveSessionSummary } from '../services/learningStoreService';
import { speakHebrew } from '../services/speechService';

interface AdaptiveSessionPageProps { profile: LearnerProfile; onBack: () => void; onComplete: () => void }
interface Choice { id: string; label: string }
type ActivityItem = ContentItemBase & { prompt?: string; audioText?: string; visual?: string; left?: string; right?: string; value?: string; itemName?: string; options?: Choice[]; correctOptionId?: string };

function deterministicChoices(item: ActivityItem, bank: ActivityItem[]): { prompt: string; choices: Choice[]; correctId: string } {
  if (item.options?.length && item.correctOptionId) return { prompt: item.prompt ?? item.audioText ?? 'מה מתאים?', choices: item.options, correctId: item.correctOptionId };
  const correct = item.right ?? item.value ?? '';
  const candidates = bank.map((candidate) => candidate.right ?? candidate.value ?? '').filter((value) => value && value !== correct);
  const distractors = [...new Set(candidates)].sort((first, second) => `${item.id}:${first}`.localeCompare(`${item.id}:${second}`)).slice(0, 2);
  const choices = [correct, ...distractors].map((label, index) => ({ id: `choice-${index}`, label }));
  return { prompt: item.left ? `מה מתאים ל־${item.left}?` : 'איזה כרטיס ראינו?', choices, correctId: 'choice-0' };
}

export function AdaptiveSessionPage({ profile, onBack, onComplete }: AdaptiveSessionPageProps) {
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [hintUsed, setHintUsed] = useState(false);
  const [memoryVisible, setMemoryVisible] = useState(true);
  const [error, setError] = useState('');
  const startedAt = useRef(performance.now());
  const sessionStartedAt = useRef(new Date());

  useEffect(() => {
    let active = true;
    Promise.all([
      loadLearningContentIndex(),
      Promise.all((['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting'] as const).map((game) => loadGameContent<ActivityItem>(game)))
    ]).then(([descriptors, envelopes]) => {
      if (!active) return;
      const data = getProfileData(profile.id);
      const nextPlan = data.activePlan && !data.activePlan.completedAt
        ? data.activePlan
        : planAdaptiveSession(profile, data, descriptors as LearningContentDescriptor[], new Date(), `session-${data.sessions.length + 1}`);
      setPlan(nextPlan);
      setItems(envelopes.flatMap((envelope) => envelope.items));
      saveActivePlan(profile.id, nextPlan);
    }).catch(() => setError('לא הצלחנו להכין את התרגול. אפשר לחזור ולנסות שוב.'));
    return () => { active = false; };
  }, [profile]);

  const task = plan?.tasks[index];
  const item = items.find((candidate) => candidate.id === task?.contentId);
  const gameBank = useMemo(() => items.filter((candidate) => candidate.id.split('-')[0] === item?.id.split('-')[0]), [item, items]);
  const activity = item ? deterministicChoices(item, gameBank) : null;

  useEffect(() => {
    setSelected(null); setAttempt(1); setHintUsed(false); setMemoryVisible(true); startedAt.current = performance.now();
    if (task?.evidenceForm !== 'memory') return;
    const timer = window.setTimeout(() => setMemoryVisible(false), profile.accessibility.extendedResponseTime ? 3500 : 2200);
    return () => window.clearTimeout(timer);
  }, [index, profile.accessibility.extendedResponseTime, task?.evidenceForm]);

  function submit(choiceId: string) {
    if (!task || !activity || selected) return;
    const correct = choiceId === activity.correctId;
    setSelected(choiceId);
    recordLearningEvent({ profileId: profile.id, sessionId: plan?.id ?? 'adaptive-session', contentId: task.contentId,
      skillIds: task.skillIds, gameId: task.gameId, evidenceForm: task.evidenceForm, correct,
      attemptNumber: attempt, hintUsed, responseMs: Math.round(performance.now() - startedAt.current), monotonicMs: Math.round(performance.now()) });
    if (!correct) setAttempt((value) => value + 1);
    speakHebrew(correct ? 'כל הכבוד!' : 'כמעט. ננסה בדרך אחרת.', { mode: 'guided' });
  }

  function next() {
    if (!plan || !task || !selected) return;
    const tasks = plan.tasks.map((candidate, taskIndex) => taskIndex === index ? { ...candidate, completed: true } : candidate);
    if (index < tasks.length - 1) {
      const nextPlan = { ...plan, tasks }; setPlan(nextPlan); saveActivePlan(profile.id, nextPlan); setIndex((value) => value + 1); return;
    }
    const completedAt = new Date();
    const completedPlan = { ...plan, tasks, completedAt: completedAt.toISOString() };
    saveActivePlan(profile.id, null);
    const events = getProfileData(profile.id).events.filter((event) => event.sessionId === plan.id);
    saveSessionSummary({ id: plan.id, profileId: profile.id, mode: 'adaptive', startedAt: sessionStartedAt.current.toISOString(),
      completedAt: completedAt.toISOString(), durationSeconds: Math.max(1, Math.round((completedAt.getTime() - sessionStartedAt.current.getTime()) / 1000)),
      correct: events.filter((event) => event.correct).length, total: events.length });
    setPlan(completedPlan); onComplete();
  }

  if (error) return <main className="adaptive-session" dir="rtl"><p role="alert">{error}</p><Button onClick={onBack}>חזרה</Button></main>;
  if (!plan || !task || !item || !activity) return <main className="adaptive-session" dir="rtl"><p role="status">מכינים תרגול מותאם...</p></main>;
  const isMemoryPreview = task.evidenceForm === 'memory' && memoryVisible;
  return (
    <main className="adaptive-session" dir="rtl" data-testid="adaptive-session">
      <header className="adaptive-session__header">
        <Button variant="ghost" onClick={onBack}>חזרה</Button>
        <div><strong>תרגול מותאם</strong><small>{task.reason}</small></div>
        <Button variant="ghost" aria-label="חזרה על ההוראה" onClick={() => speakHebrew(activity.prompt, { mode: 'manual' })}>🔊 שוב</Button>
      </header>
      <ProgressBar current={index + 1} total={plan.tasks.length} />
      <section className="adaptive-session__card" aria-live="polite">
        <span className="question-card__tag">משימה {index + 1} מתוך {plan.tasks.length}</span>
        <h1>{isMemoryPreview ? 'זוכרים את הכרטיס' : activity.prompt}</h1>
        {isMemoryPreview ? <div className="adaptive-session__memory">{item.value}</div> : (
          <div className="adaptive-session__choices">
            {activity.choices.map((choice) => <button key={choice.id} type="button" disabled={Boolean(selected)}
              className={selected === choice.id ? choice.id === activity.correctId ? 'is-correct' : 'is-wrong' : ''}
              onClick={() => submit(choice.id)}>{choice.label}</button>)}
          </div>
        )}
        {!isMemoryPreview && !selected ? <Button variant="ghost" onClick={() => { setHintUsed(true); speakHebrew(`רמז: התשובה היא ${activity.choices.find((choice) => choice.id === activity.correctId)?.label ?? ''}`, { mode: 'manual' }); }}>רמז עדין</Button> : null}
        {selected ? <div className="adaptive-session__feedback" role="status">
          <strong>{selected === activity.correctId ? 'מצוין!' : 'ניסיון טוב — עכשיו ראינו את התשובה.'}</strong>
          <Button onClick={next}>{index === plan.tasks.length - 1 ? 'סיום התרגול' : 'למשימה הבאה'}</Button>
        </div> : null}
      </section>
    </main>
  );
}
