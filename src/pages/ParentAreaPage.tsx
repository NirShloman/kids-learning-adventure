import { FormEvent, useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { ageOptions, difficultyOptions } from '../data/levels';
import type { AccessibilitySettings, LearnerProfile, LocalLearnerState, MasteryStatus } from '../types';
import { isValidHebrewName, normalizeHebrewName } from '../utils/hebrew';
import { deleteProfile, getLearningSnapshot, getProfileData, selectProfile, updateProfile } from '../services/learningStoreService';
import { skillGraph } from '../learning/skillGraph';

interface ParentAreaPageProps { learner: LocalLearnerState; onBack: () => void; onAddProfile: () => void; onReloadState: () => void; onReset: () => Promise<void> }
const statusLabels: Record<MasteryStatus, string> = { new: 'חדש', exposed: 'נחשף', practicing: 'בתרגול', 'almost-mastered': 'כמעט שולט', mastered: 'נרכש', 'needs-reinforcement': 'דורש חיזוק' };
const accessibilityLabels: Record<keyof AccessibilitySettings, string> = {
  noTimeLimit: 'ללא הגבלת זמן', reducedMotion: 'פחות אנימציה', reducedParticles: 'פחות חלקיקים',
  reducedBackgroundAudio: 'פחות רעשי רקע', fewerItems: 'פחות פריטים על המסך', largeTouchTargets: 'אזורי מגע גדולים',
  highContrast: 'ניגודיות גבוהה', slowNarration: 'קריינות איטית', extendedResponseTime: 'זמן תגובה ארוך יותר',
  disableMovingObstacles: 'ללא מכשולים נעים', strongGuidance: 'הכוונה חזקה יותר', strongSnap: 'הצמדה חזקה יותר'
};

function trendFor(profile: LearnerProfile): string {
  const sessions = getProfileData(profile.id).sessions;
  const score = (rows: typeof sessions) => rows.reduce((sum, row) => sum + (row.total ? row.correct / row.total : 0), 0) / Math.max(1, rows.length);
  if (sessions.length < 4) return 'נאסף מידע בקצב רגוע';
  const change = score(sessions.slice(0, 3)) - score(sessions.slice(3, 6));
  return change > 0.08 ? 'מגמת שיפור' : change < -0.08 ? 'כדאי לחזק חומר מוכר' : 'התקדמות יציבה';
}

export function ParentAreaPage({ learner, onBack, onAddProfile, onReloadState, onReset }: ParentAreaPageProps) {
  const challenge = useMemo(() => { const first = 7 + Math.floor(Math.random() * 3); const second = 6 + Math.floor(Math.random() * 3); return { first, second, answer: first * second }; }, []);
  const [answer, setAnswer] = useState(''); const [unlocked, setUnlocked] = useState(false); const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const snapshot = useMemo(() => getLearningSnapshot(), [learner.updatedAt, revision]);
  const active = snapshot.profiles.find((profile) => profile.id === snapshot.activeProfileId) ?? null;
  const data = active ? getProfileData(active.id, snapshot) : null;
  const [name, setName] = useState(learner.name);

  function refresh() { setRevision((value) => value + 1); onReloadState(); }
  function unlock(event: FormEvent) { event.preventDefault(); const correct = Number(answer) === challenge.answer; setUnlocked(correct); setError(!correct); }
  function saveProfile(event: FormEvent) {
    event.preventDefault(); if (!active) return;
    const normalized = normalizeHebrewName(name);
    if (normalized && !isValidHebrewName(normalized)) { setError(true); return; }
    updateProfile(active.id, { name: normalized }); setError(false); refresh();
  }
  function patchActive(updates: Partial<LearnerProfile>) { if (!active) return; updateProfile(active.id, updates); refresh(); }

  if (!unlocked) return <main className="parent-area" dir="rtl"><section className="parent-area__card" aria-labelledby="parent-gate-title">
    <span className="question-card__tag">אזור הורים</span><h1 id="parent-gate-title">בדיקה קצרה למבוגר</h1><p>כדי לפתוח את ההתקדמות וההגדרות, פתרו את התרגיל.</p>
    <form onSubmit={unlock}><label htmlFor="parent-answer">כמה זה {challenge.first} × {challenge.second}?</label><input id="parent-answer" inputMode="numeric" pattern="[0-9]*" value={answer} onChange={(event) => setAnswer(event.target.value)} autoFocus />
      {error ? <p className="profile-setup__error" role="alert">התשובה אינה נכונה.</p> : null}<Button type="submit">פתיחת אזור הורים</Button></form><Button variant="ghost" onClick={onBack}>חזרה</Button>
  </section></main>;

  return <main className="parent-area parent-area--dashboard" dir="rtl"><section className="parent-area__card">
    <header className="parent-dashboard__header"><div><span className="question-card__tag">אזור הורים פתוח</span><h1>המסלול האישי נשאר במכשיר</h1><p>אין חשבון, ענן, פרסומות, Analytics או השוואה לילדים אחרים.</p></div><Button onClick={onBack}>חזרה לאפליקציה</Button></header>

    <section className="parent-dashboard__section" aria-labelledby="profiles-title"><h2 id="profiles-title">פרופילים מקומיים</h2><div className="profile-list">
      {snapshot.profiles.map((profile) => <div className={profile.id === active?.id ? 'profile-chip is-active' : 'profile-chip'} key={profile.id}>
        <button type="button" onClick={() => { selectProfile(profile.id); setName(profile.name); refresh(); }}><span aria-hidden="true">{profile.avatarId === 'shir' ? '👧' : '👦'}</span>{profile.name || `ילד/ה בגיל ${profile.age}`}</button>
        <button type="button" aria-label={`מחיקת הפרופיל ${profile.name || ''}`} onClick={() => { if (window.confirm('למחוק את הפרופיל וההתקדמות שלו?')) { deleteProfile(profile.id); refresh(); } }}>×</button>
      </div>)}
      <Button variant="secondary" onClick={onAddProfile}>הוספת פרופיל</Button>
    </div></section>

    {active && data ? <>
      <section className="parent-dashboard__summary"><article><strong>{trendFor(active)}</strong><span>מגמה לפי הפעילויות האחרונות</span></article><article><strong>{data.sessions.length ? `${Math.round(data.sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60)} דקות` : 'טרם תועד'}</strong><span>זמן משחק משוער</span></article><article><strong>{data.events.length ? new Date(data.events[data.events.length - 1].occurredAt).toLocaleDateString('he-IL') : 'מתחילים עכשיו'}</strong><span>פעילות אחרונה</span></article></section>

      <section className="parent-dashboard__section"><h2>מפת מיומנויות</h2><p>המערכת בוחרת חזרה, תרגול ואתגר קטן לפי הצלחות, ניסיונות, רמזים וגיוון. זמן איטי אינו מוריד התקדמות.</p><div className="skill-map">
        {skillGraph.map((skill) => { const mastery = data.mastery[skill.id]; const status = mastery?.status ?? 'new'; return <article key={skill.id} className={`skill-map__item skill-map__item--${status}`}><div><strong>{skill.name}</strong><span>{statusLabels[status]}</span></div><p>{skill.description}</p><small>{skill.evidenceLimit === 'partial' ? 'קיימת תשתית; נדרש עוד תוכן מקצועי לפני קביעת שליטה.' : `ביטחון נוכחי: ${mastery?.confidence ?? 0}`}</small></article>; })}
      </div></section>

      <section className="parent-dashboard__section"><h2>המלצה קצרה</h2><p>{data.activePlan?.tasks.find((task) => !task.completed)?.reason ?? 'להתחיל תרגול מותאם קצר כדי לקבל המלצה אישית.'}</p><p><strong>בלי מסך:</strong> {skillGraph.find((skill) => data.activePlan?.tasks[0]?.skillIds.includes(skill.id))?.offScreenIdea ?? 'בחרו חפץ מוכר, תארו אותו ומיינו יחד לפי צבע או צורה.'}</p></section>

      <section className="parent-dashboard__section"><h2>פרופיל והעדפות</h2><form className="parent-area__profile" onSubmit={saveProfile}><label htmlFor="parent-learner-name">כינוי אופציונלי</label><input id="parent-learner-name" value={name} maxLength={30} autoComplete="off" onChange={(event) => setName(event.target.value)} />
        <label htmlFor="learner-age">גיל</label><select id="learner-age" value={active.age} onChange={(event) => patchActive({ age: Number(event.target.value) as LearnerProfile['age'] })}>{ageOptions.map((age) => <option key={age}>{age}</option>)}</select>
        <label htmlFor="learner-avatar">דמות מלווה</label><select id="learner-avatar" value={active.avatarId} onChange={(event) => { const avatarId = event.target.value as LearnerProfile['avatarId']; patchActive({ avatarId, gender: avatarId === 'shir' ? 'girl' : 'boy' }); }}><option value="shir">בת</option><option value="nir-kippah">בן עם כיפה</option><option value="nir-plain">בן ללא כיפה</option></select>
        <label htmlFor="learner-difficulty">רמה ידנית</label><select id="learner-difficulty" value={active.manualDifficulty} onChange={(event) => patchActive({ learningMode: 'manual', manualDifficulty: event.target.value as LearnerProfile['manualDifficulty'] })}>{difficultyOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
        {error ? <p role="alert">אם בוחרים כינוי, יש לכתוב אותו בעברית.</p> : null}<Button type="submit">שמירת פרופיל והגדרות</Button></form></section>

      <section className="parent-dashboard__section"><h2>מצב נגיש ורגוע</h2><div className="accessibility-grid">{(Object.keys(accessibilityLabels) as Array<keyof AccessibilitySettings>).map((key) => <label key={key}><input type="checkbox" checked={active.accessibility[key]} onChange={(event) => patchActive({ accessibility: { ...active.accessibility, [key]: event.target.checked } })} />{accessibilityLabels[key]}</label>)}</div></section>
      <section className="parent-dashboard__section"><h2>עוצמות קול נפרדות</h2><div className="volume-grid">
        <label>קריינות <input type="range" min="0" max="100" value={active.narrationVolume} onChange={(event) => patchActive({ narrationVolume: Number(event.target.value) })} /></label>
        <label>מוזיקה <input type="range" min="0" max="100" value={active.musicVolume} onChange={(event) => patchActive({ musicVolume: Number(event.target.value) })} /></label>
        <label>אפקטים <input type="range" min="0" max="100" value={active.soundEffectsVolume} onChange={(event) => patchActive({ soundEffectsVolume: Number(event.target.value) })} /></label>
      </div></section>
    </> : <p>צרו פרופיל כדי להתחיל.</p>}

    <section className="parent-area__actions"><a className="button button--ghost" href="/privacy.html">מדיניות פרטיות</a><a className="button button--ghost" href="/terms.html">תנאי שימוש</a><a className="button button--ghost" href="/purchases.html">רכישות</a><a className="button button--ghost" href="/copyright.html">זכויות יוצרים</a><a className="button button--ghost" href="/licenses.html">רישיונות</a><a className="button button--ghost" href="/support.html">תמיכה</a><Button variant="ghost" onClick={async () => { if (window.confirm('למחוק לצמיתות את כל נתוני האפליקציה מהמכשיר?')) await onReset(); }}>מחיקת כל הנתונים מהמכשיר</Button></section>
  </section></main>;
}
