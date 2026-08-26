import { useEffect, useRef, useState } from 'react';
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState<string | null>(null); const [teamScore, setTeamScore] = useState(0);
  const startedAt = useRef(new Date()); const questionStartedAt = useRef(performance.now());
  const sessionId = useRef(`shared-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  useEffect(() => {
    if (!mode) return;
    const learner = profiles.find((profile) => profile.id === firstId) ?? profiles[0];
    void getQuizQuestions(index % 2 ? 'numbers' : 'letters', learner?.age ?? 4, 'easy').then((items) => setQuestions(items.slice(0, 6)));
  }, [firstId, mode, profiles]);

  function answer(optionId: string) {
    const question = questions[index]; if (!question || selected) return;
    const correct = optionId === question.correctOptionId; setSelected(optionId); if (correct) setTeamScore((score) => score + 1);
    const participantId = mode === 'turns' ? (index % 2 === 0 ? firstId : secondId) : firstId;
    if (!participantId.startsWith('guest')) recordLearningEvent({ profileId: participantId, sessionId: sessionId.current,
      contentId: question.id, skillIds: question.skillIds ?? skillIdsForLegacySkill(question.skill), gameId: question.category,
      evidenceForm: mode === 'turns' ? 'shared-turn' : 'shared-cooperation', correct, attemptNumber: 1, hintUsed: mode === 'cooperation',
      responseMs: Math.round(performance.now() - questionStartedAt.current), monotonicMs: Math.round(performance.now()) });
  }

  function next() {
    if (index < questions.length - 1) { setIndex((value) => value + 1); setSelected(null); questionStartedAt.current = performance.now(); return; }
    const completedAt = new Date(); const participantIds = mode === 'turns' ? [firstId, secondId] : [firstId];
    for (const profileId of [...new Set(participantIds)].filter((id) => !id.startsWith('guest'))) saveSessionSummary({
      id: `${sessionId.current}-${profileId}`, profileId, mode: mode === 'turns' ? 'shared-turns' : 'shared-cooperation',
      startedAt: startedAt.current.toISOString(), completedAt: completedAt.toISOString(),
      durationSeconds: Math.max(1, Math.round((completedAt.getTime() - startedAt.current.getTime()) / 1000)), correct: teamScore, total: questions.length
    });
    setIndex(questions.length);
  }

  if (!mode) return <main className="shared-play" dir="rtl"><section><span className="question-card__tag">משחק משותף מקומי</span><h1>לומדים יחד, בלי מנצחים ומפסידים</h1><p>בוחרים דרך לשתף פעולה. אין צורך ברשת והמידע נשאר במכשיר.</p><div className="shared-play__modes"><button onClick={() => setMode('turns')}><strong>שני ילדים בתורות</strong><span>כל אחד מקבל תור קצר והכוכבים שייכים לקבוצה.</span></button><button onClick={() => setMode('cooperation')}><strong>הורה וילד</strong><span>המבוגר נותן רמז והילד או הילדה מגלים.</span></button></div><Button variant="ghost" onClick={onBack}>חזרה</Button></section></main>;
  if (!questions.length) return <main className="shared-play" dir="rtl"><p>מכינים משימה משותפת...</p></main>;
  if (index >= questions.length) return <main className="shared-play" dir="rtl"><section><h1>איזו עבודת צוות נהדרת!</h1><p>אספתם יחד {teamScore} כוכבי קבוצה. כל ניסיון עזר לקבוצה ללמוד.</p><Button onClick={onBack}>חזרה לעולמות</Button></section></main>;
  const question = questions[index]; const currentId = mode === 'turns' ? (index % 2 === 0 ? firstId : secondId) : firstId;
  const currentName = profiles.find((profile) => profile.id === currentId)?.name || (currentId.startsWith('guest') ? 'אורח/ת' : 'הילד/ה');
  return <main className="shared-play" dir="rtl"><section><header><Button variant="ghost" onClick={onBack}>חזרה</Button><strong>כוכבי קבוצה: {teamScore}</strong></header>
    {index === 0 ? <div className="shared-play__participants"><label>משתתף/ת ראשון/ה<select value={firstId} onChange={(event) => setFirstId(event.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name || `גיל ${profile.age}`}</option>)}<option value="guest-1">אורח/ת</option></select></label>{mode === 'turns' ? <label>משתתף/ת שני/ה<select value={secondId} onChange={(event) => setSecondId(event.target.value)}>{profiles.filter((profile) => profile.id !== firstId).map((profile) => <option key={profile.id} value={profile.id}>{profile.name || `גיל ${profile.age}`}</option>)}<option value="guest-2">אורח/ת</option></select></label> : null}</div> : null}
    <span className="question-card__tag">{mode === 'turns' ? `התור של ${currentName}` : 'המבוגר נותן רמז, הילד/ה בוחר/ת'}</span><h1>{question.prompt}</h1>
    <div className="shared-play__choices">{question.options.map((option) => <button key={option.id} disabled={Boolean(selected)} className={selected === option.id ? option.id === question.correctOptionId ? 'is-correct' : 'is-wrong' : ''} onClick={() => answer(option.id)}>{option.emoji} {option.label}</button>)}</div>
    {selected ? <div role="status"><p>{selected === question.correctOptionId ? 'הקבוצה מצאה יחד!' : 'ניסיון קבוצתי טוב — ממשיכים יחד.'}</p><Button onClick={next}>{index === questions.length - 1 ? 'סיום' : 'לתור הבא'}</Button></div> : null}
  </section></main>;
}
