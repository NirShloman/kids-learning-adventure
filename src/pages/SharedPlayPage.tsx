import { useEffect, useRef, useState } from 'react';
import { useGameFeedback } from '../hooks/useGameFeedback';
import { useSpeech } from '../hooks/useSpeech';
import { Button } from '../components/common/Button';
import type { LearnerProfile, QuizQuestion } from '../types';
import { getQuizQuestions } from '../services/questionService';
import { recordLearningEvent, saveSessionSummary } from '../services/learningStoreService';
import { skillIdsForLegacySkill } from '../learning/skillGraph';

interface SharedPlayPageProps { profiles: LearnerProfile[]; onBack: () => void }
type SharedMode = 'turns' | 'cooperation';

export function SharedPlayPage({ profiles, onBack }: SharedPlayPageProps) {
  const [mode, setMode] = useState<SharedMode | null>(null);
  const [firstId, setFirstId] = useState(profiles[0]?.id ?? 'guest-1');
  const [secondId, setSecondId] = useState(profiles[1]?.id ?? 'guest-2');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [hinted, setHinted] = useState(false);
  const attempt = useRef(1);
  const score = useRef(0);
  const finished = useRef(false);
  const voiceEnabled = profiles.find(p => p.id === firstId)?.narrationEnabled ?? false;
  const feedback = useGameFeedback(voiceEnabled);
  const { speak, stop } = useSpeech(voiceEnabled);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState<string | null>(null); const [teamScore, setTeamScore] = useState(0);
  const startedAt = useRef(new Date()); const questionStartedAt = useRef(performance.now());
  const sessionId = useRef(`shared-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  useEffect(() => {
    if (questions[index]) speak(questions[index].prompt);
    return stop;
  }, [questions, index, speak, stop]);

  useEffect(() => {
    if (!mode || !ready) return;
    let active = true;
    const learner = profiles.find((profile) => profile.id === firstId) ?? profiles[0];
    void getQuizQuestions('letters', learner?.age ?? 4, learner?.manualDifficulty ?? 'medium')
      .then(items => { if (active) { setQuestions(items.slice(0, 6)); setError(!items.length); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [firstId, mode, ready]);

  function answer(optionId: string) {
    const question = questions[index]; if (!question || feedback.locked.current || finished.current) return;
    const correct = optionId === question.correctOptionId; setSelected(optionId); if (correct) { score.current += 1; setTeamScore(score.current); }
    const participantId = mode === 'turns' ? (index % 2 === 0 ? firstId : secondId) : firstId;
    if (!participantId.startsWith('guest')) recordLearningEvent({ profileId: participantId, sessionId: sessionId.current,
      contentId: question.id, skillIds: question.skillIds ?? skillIdsForLegacySkill(question.skill), gameId: question.category,
      evidenceForm: mode === 'turns' ? 'shared-turn' : 'shared-cooperation', correct, attemptNumber: attempt.current, hintUsed: mode === 'cooperation' || hinted,
      responseMs: Math.round(performance.now() - questionStartedAt.current), monotonicMs: Math.round(performance.now()) });
    attempt.current += 1;
    if (!correct) setHinted(true);
    feedback.run(correct ? 'מצוין!' : 'ננסה שוב. אפשר להיעזר ברמז.', () => {
      if (correct) next(); else { setSelected(null); questionStartedAt.current = performance.now(); }
    }, correct);
  }

  function next() {
    if (finished.current) return;
    attempt.current = 1;
    if (index < questions.length - 1) { setIndex((value) => value + 1); setSelected(null); setHinted(false); questionStartedAt.current = performance.now(); return; }
    finished.current = true;
    const completedAt = new Date(); const participantIds = mode === 'turns' ? [firstId, secondId] : [firstId];
    for (const profileId of [...new Set(participantIds)].filter((id) => !id.startsWith('guest'))) saveSessionSummary({
      id: `${sessionId.current}-${profileId}`, profileId, mode: mode === 'turns' ? 'shared-turns' : 'shared-cooperation',
      startedAt: startedAt.current.toISOString(), completedAt: completedAt.toISOString(),
      durationSeconds: Math.max(1, Math.round((completedAt.getTime() - startedAt.current.getTime()) / 1000)), correct: score.current, total: questions.length
    });
    setIndex(questions.length);
  }

  const isCorrectAnswer = Boolean(selected) && selected === questions[index]?.correctOptionId;


  if (!mode) return <main className="shared-play" dir="rtl"><section><span className="question-card__tag">משחק משותף מקומי</span><h1>לומדים יחד, בלי מנצחים ומפסידים</h1><p>בוחרים דרך לשתף פעולה. אין צורך ברשת והמידע נשאר במכשיר.</p><div className="shared-play__modes"><button onClick={() => setMode('turns')}><strong>שני ילדים בתורות</strong><span>כל אחד מקבל תור קצר והכוכבים שייכים לקבוצה.</span></button><button onClick={() => setMode('cooperation')}><strong>הורה וילד</strong><span>המבוגר נותן רמז והילד או הילדה מגלים.</span></button></div><Button variant="ghost" onClick={onBack}>חזרה</Button></section></main>;
  if (!ready) return <main className="shared-play" dir="rtl"><section><h1>מי משחקים יחד?</h1>    <div className="shared-play__participants"><label>משתתף/ת ראשון/ה<select value={firstId} onChange={(event) => setFirstId(event.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name || `גיל ${profile.age}`}</option>)}<option value="guest-1">אורח/ת</option></select></label>{mode === 'turns' ? <label>משתתף/ת שני/ה<select value={secondId} onChange={(event) => setSecondId(event.target.value)}>{profiles.filter((profile) => profile.id !== firstId).map((profile) => <option key={profile.id} value={profile.id}>{profile.name || `גיל ${profile.age}`}</option>)}<option value="guest-2">אורח/ת</option></select></label> : null}</div><Button onClick={() => setReady(true)}>מתחילים יחד</Button><Button variant="ghost" onClick={onBack}>חזרה</Button></section></main>;
  if (error) return <main className="shared-play" dir="rtl"><section><p role="alert">לא הצלחנו להכין את המשחק.</p><Button onClick={() => { setError(false); setReady(false); }}>ננסה שוב</Button><Button onClick={onBack}>חזרה</Button></section></main>;
  if (!questions.length) return <main className="shared-play" dir="rtl"><p>מכינים משימה משותפת...</p></main>;
  if (index >= questions.length) return <main className="shared-play" dir="rtl"><section><h1>איזו עבודת צוות נהדרת!</h1><p>אספתם יחד {teamScore} כוכבי קבוצה. כל ניסיון עזר לקבוצה ללמוד.</p><Button onClick={onBack}>חזרה לעולמות</Button></section></main>;
  const question = questions[index]; const currentId = mode === 'turns' ? (index % 2 === 0 ? firstId : secondId) : firstId;
  const currentName = profiles.find((profile) => profile.id === currentId)?.name || (currentId.startsWith('guest') ? 'אורח/ת' : 'הילד/ה');
  return <main className="shared-play shared-play--question" dir="rtl"><section><header><Button variant="ghost" onClick={onBack}>חזרה</Button><strong>כוכבי קבוצה: {teamScore}</strong></header>

    <span className="question-card__tag">{mode === 'turns' ? `התור של ${currentName}` : 'המבוגר נותן רמז, הילד/ה בוחר/ת'}</span><h1>{question.prompt}</h1>
    <div className="shared-play__choices">{question.options.map((option) => <button key={option.id} disabled={feedback.busy} className={isCorrectAnswer && option.id === question.correctOptionId ? 'is-correct' : selected === option.id ? 'is-wrong' : ''} onClick={() => answer(option.id)}>{option.emoji} {option.label}</button>)}</div>
    <div className="shared-feedback" role="status">{feedback.message || (isCorrectAnswer ? "✓" : "חושבים יחד ובוחרים")}{hinted && !isCorrectAnswer && question.hint ? <span>{question.hint}</span> : null}</div>
  </section></main>;
}
