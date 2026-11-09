import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import App from '../App';
import { ParentAreaPage } from '../pages/ParentAreaPage';
import { createProfile, deleteProfile, selectProfile } from '../services/learningStoreService';
import { getLocalLearnerState } from '../services/learnerProgressService';
import { localPersistence } from '../services/localDataStore';
import { stopMusic, stopNarration } from '../services/audioService';
import { stopNarrationPlayback } from '../services/narrationService';
import { stopSpeaking } from '../services/speechService';
import { preparePilotOffline, offlineReady } from './offline';
import { accountInfo, call, login, logout, observeAccount, pullRecords, reauthenticate, resetPassword, submitOperation } from './cloud';
import { PilotRepository } from './repository';
import { PilotDatabase } from './database';
import { derivePin } from './pin';
import type { KindergartenAccount } from './model';
import type { Age, LearningSnapshotV4 } from '../types';
import './pilot.css';

const message = (error: unknown) => error instanceof Error && /^[א-ת]/.test(error.message) ? error.message : 'הפעולה לא הושלמה. בדקו את החיבור ואת הפרטים ונסו שוב.';
function silence() { stopMusic(0); stopNarration(); stopNarrationPlayback(); stopSpeaking(); for(const key of ['reducedMotion','reducedParticles','largeTouch','highContrast','fewerItems'])delete document.documentElement.dataset[key];window.dispatchEvent(new CustomEvent('lomdim:app-state', { detail: { isActive: false } })); }

export default function PilotApp() {
  const [repo, setRepo] = useState<PilotRepository>();
  const [stage, setStage] = useState<'loading' | 'login' | 'pin' | 'staff' | 'play'>('loading');
  const [account, setAccount] = useState<(KindergartenAccount & { pinSet: boolean })>();
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [pin, setPin] = useState('');
  const [trusted, setTrusted] = useState(false); const [needsPin, setNeedsPin] = useState(false); const [resetPin, setResetPin] = useState(false);
  const [search, setSearch] = useState(''); const [names, setNames] = useState(''); const [age, setAge] = useState<Age>(4); const [preview, setPreview] = useState(false);
  const [revision, setRevision] = useState(0); const [editing, setEditing] = useState(false); const [playKey, setPlayKey] = useState(0);
  const [shared, setShared] = useState<string[] | undefined>(); const [pairFirst, setPairFirst] = useState(''); const [pairSecond, setPairSecond] = useState('');
  const [legacy, setLegacy] = useState<LearningSnapshotV4>(); const [ready, setReady] = useState(false);
  const [resumeChild, setResumeChild] = useState<string>();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    let active = true; let owned: PilotRepository | undefined; let generation=0;
    const unsub = observeAccount(user => {
      const token=++generation;
      owned?.detach();owned=undefined;silence();setRepo(undefined);setAccount(undefined);setLegacy(undefined);setEditing(false);setShared(undefined);
      if (!user) { setStage('login'); return; }
      void (async () => {
        let pendingRepo: PilotRepository | undefined;
        try {
          setStage('loading');
          const database = new PilotDatabase(user.uid);
          const cached = await database.read<KindergartenAccount & { pinSet: boolean }>('meta', 'account');
          const trust = await database.read<boolean>('meta', 'trusted') ?? false;
          const a = navigator.onLine ? await accountInfo() : trust && cached;
          if (!a) throw new Error('יש להתחבר לרשת כדי להכין מחשב זה לשימוש.');
          if (!active || token!==generation) return;
          const raw = localStorage.getItem('lomdim-bekef.learning.v4');
          if (raw && !await database.read('meta', 'imported')) {
            try { const source = JSON.parse(raw); if (source.schemaVersion === 4 && Array.isArray(source.profiles) && source.profiles.length) setLegacy(source); } catch { /* Preserve unreadable legacy source. */ }
          }
          const current = new PilotRepository(a, { submit: submitOperation, pull: pullRecords });
          pendingRepo=current;owned=current;
          await current.initialize();
          if (!active || token!==generation) { current.detach();return; }
          if (navigator.onLine) await current.refresh();
          await database.setMeta('account', a);
          if (!active || token!==generation) { current.detach(); return; }
          const prepared=await offlineReady();
          if (!active || token!==generation) { current.detach(); return; }
          setAccount(a); setRepo(current); setTrusted(trust); setNeedsPin(!a.pinSet); setReady(prepared); setStage('pin');
        } catch (err) { pendingRepo?.detach(); if (active && token===generation) { setError(message(err)); setStage('login'); } }
      })();
    });
    return () => { active = false; unsub(); owned?.detach(); };
  }, []);
  useEffect(() => {
    const network = () => { setOnline(navigator.onLine); if (navigator.onLine) void repo?.sync(); };
    window.addEventListener('online', network); window.addEventListener('offline', network);
    const timer = setInterval(() => { void repo?.sync(true); }, 15000);
    const confirmed = () => setOnline(true);
    window.addEventListener('pilot:network-confirmed',confirmed);
    const deleted = () => { silence(); setStage('pin'); setError('הפרופיל נמחק. יש לבחור ילד אחר באזור הצוות.'); };
    window.addEventListener('pilot:profile-deleted', deleted);
    return () => { clearInterval(timer); window.removeEventListener('online', network); window.removeEventListener('offline', network); window.removeEventListener('pilot:profile-deleted', deleted); window.removeEventListener('pilot:network-confirmed',confirmed); };
  }, [repo]);
  async function run(job: () => Promise<void>) { setBusy(true); setError(''); setNotice(''); try { await job(); } catch (err) { setError(message(err)); } finally { setBusy(false); } }
  async function unlock() {
    if (!repo) return;
    if (needsPin || resetPin) { await reauthenticate(password); await call('pilotSetPin', { pin }); setNeedsPin(false); setResetPin(false); if (account) { const updated = { ...account, pinSet: true }; setAccount(updated); await repo.database.setMeta('account', updated); } }
    else if (navigator.onLine) await call('pilotVerifyPin', { pin });
    else {
      if (!trusted || !ready) throw new Error('המחשב אינו מוכן למשחק ללא רשת.');
      const lock = await repo.database.read<{ failures: number; until: number }>('meta', 'pinLock');
      if (lock && lock.until > Date.now()) throw new Error('יש להמתין חמש דקות לפני ניסיון נוסף.');
      const saved = await repo.database.read<{ salt: string; hash: string }>('meta', 'pin');
      if (!saved || saved.hash !== await derivePin(pin, saved.salt)) { const failures = (lock?.failures ?? 0) + 1; await repo.database.setMeta('pinLock', { failures: failures >= 5 ? 0 : failures, until: failures >= 5 ? Date.now() + 300000 : 0 }); throw new Error('הקוד שגוי.'); }
      await repo.database.setMeta('pinLock', { failures: 0, until: 0 });
    }
    await repo.database.setMeta('trusted', trusted);
    if (trusted && navigator.onLine) { const salt = crypto.randomUUID(); await repo.database.setMeta('pin', { salt, hash: await derivePin(pin, salt) }); }
    if (!trusted) await repo.database.setMeta('pin', null);
    if (navigator.onLine) await repo.refresh();
    setPin(''); setPassword(''); setStage('staff');
  }
  async function staff() { silence(); setStage('pin'); setEditing(false); setPin(''); await localPersistence.flush(); }
  async function start(profileId: string, resumeSession?: string, participants?: string[]) {
    if (!repo) return;
    if (!online && (!trusted || !await offlineReady())) throw new Error('הכינו את המחשב למשחק ללא רשת באזור הצוות.');
    await localPersistence.flush();
    silence(); repo.beginSession(profileId, resumeSession); setShared(participants); setResumeChild(undefined); setPlayKey(k => k + 1); setStage('play');
  }
  const snapshot = repo?.read();
  const rows = names.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
  const duplicateNames = [...new Set(rows.filter((n,i) => rows.indexOf(n) !== i || snapshot?.profiles.some(p => p.name === n)))];
  const active = snapshot?.profiles.find(p => p.id === snapshot.activeProfileId);
  void revision;
  return <div className={`pilot ${stage === 'play' ? 'pilot--playing' : ''}`} dir="rtl">
    <header className="pilot-bar"><strong>עולמיה <span>לגנים</span></strong><span>{account?.name}</span>{stage === 'play' && active && <b>{shared ? '🤝' : active.avatarId === 'shir' ? '👧' : '👦'} {shared ? shared.map(id=>snapshot?.profiles.find(p=>p.id===id)?.name).join(' + ') : active.name}</b>}{repo && <SyncBanner repo={repo} online={online} ready={ready} />}{stage === 'play' && <button onClick={() => void run(staff)}>אזור צוות והחלפת ילד</button>}</header>
    {error && <p className="pilot-error" role="alert">{error}</p>}{notice && <p className="pilot-notice" role="status">{notice}</p>}
    {stage === 'loading' && <main className="pilot-card"><h1>מכינים את סביבת הגן…</h1></main>}
    {stage === 'login' && <main className="pilot-card"><span className="pilot-eyebrow">לומדים ומגלים, כל ילד בקצב שלו</span><h1>ברוכים הבאים לגן</h1><p>כניסה לצוות הגן עם החשבון שקיבלתם לפיילוט.</p><form onSubmit={e => { e.preventDefault(); void run(async () => { await login(email, password); setPassword(''); }); }}>
      <label>אימייל הגן<input type="email" autoComplete="username" value={email} required onChange={e => setEmail(e.target.value)} /></label><label>סיסמה<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy}>כניסה לגן</button></form><button className="pilot-secondary" disabled={busy || !email} onClick={() => void run(async () => { await resetPassword(email); setNotice('אם החשבון קיים, יישלח אליו קישור לאיפוס הסיסמה.'); })}>שכחנו סיסמה</button></main>}
    {stage === 'pin' && <main className="pilot-card"><h1>{needsPin || resetPin ? 'קביעת קוד צוות' : 'כניסה לאזור הצוות'}</h1><p>בחירת ילדים וניהול הגן זמינים לצוות בלבד.</p><form onSubmit={e => { e.preventDefault(); void run(unlock); }}>
      <label>קוד צוות בן שש ספרות<input type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" required value={pin} onChange={e => setPin(e.target.value)} /></label>
      {(needsPin || resetPin) && <label>סיסמת חשבון הגן לאימות<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>}
      <label className="pilot-check"><input type="checkbox" checked={trusted} onChange={e => setTrusted(e.target.checked)} />זה מחשב קבוע של הגן; אפשר לשמור בו נתונים למשחק ללא רשת.</label><button disabled={busy}>פתיחת אזור הצוות</button></form>
      {online && !needsPin && <button className="pilot-secondary" disabled={busy} onClick={() => setResetPin(v => !v)}>{resetPin ? 'חזרה להזנת קוד' : 'איפוס קוד בעזרת סיסמת החשבון'}</button>}
    </main>}
    {stage === 'staff' && repo && snapshot && <main className="pilot-dashboard" aria-busy={busy}>
      {editing ? <ParentAreaPage key={active?.id} staffAuthorized learner={getLocalLearnerState()} onBack={() => setEditing(false)} onAddProfile={() => setEditing(false)} onReloadState={() => setRevision(v => v + 1)} onReset={async () => { throw new Error('Delete individual profiles from staff roster'); }} /> : <>
      <section className="pilot-heading"><div><span className="pilot-eyebrow">מקום לצמוח</span><h1>מי יוצא להרפתקה?</h1><p>בוחרים ילד או ילדה. ההתקדמות וההעדפות ייטענו אוטומטית.</p></div><button disabled={busy || !online} onClick={() => void run(async () => { await repo.refresh(); setRevision(v => v + 1); })}>רענון מהענן</button></section>
      <label className="pilot-search">חיפוש ילד או ילדה<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="שם או כינוי" /></label><p>{snapshot.profiles.length} ילדים בגן</p>
      <section className="pilot-roster" aria-label="ילדי הגן">{snapshot.profiles.filter(p => p.name.includes(search)).map(p => <article key={p.id}><span className="pilot-avatar" aria-hidden="true">{p.avatarId === 'shir' ? '👧' : '👦'}</span><h2>{p.name || 'ללא כינוי'}</h2><p>גיל {p.age} · {p.id.slice(-6)}</p><button disabled={busy} onClick={() => { const sessions = repo.sessionsFor(p.id); if (sessions.length) setResumeChild(p.id); else void run(() => start(p.id)); }}>מתחילים עם {p.name || 'הילד/ה'}</button><div className="pilot-actions"><button className="pilot-secondary" disabled={busy} onClick={() => { selectProfile(p.id); setEditing(true); }}>התקדמות והעדפות</button><button className="pilot-secondary" disabled={busy || !online} onClick={() => { if (confirm(`למחוק את ${p.name} ואת כל ההתקדמות?`)) void run(async () => { deleteProfile(p.id); await localPersistence.flush(); await repo.sync(); setRevision(v => v + 1); }); }}>מחיקה</button></div></article>)}</section>
      {resumeChild && <SessionChooser repo={repo} profileId={resumeChild} busy={busy} onStart={id=>void run(()=>start(resumeChild,id))} onCancel={()=>setResumeChild(undefined)} />}
      <section className="pilot-card pilot-card--wide"><h2>הוספת ילדים לגן</h2><p>מדביקים שם או כינוי בכל שורה. אפשר גם להוסיף ילד אחד. אין צורך בפרטי קשר או בתאריך לידה.</p><label>גיל ברירת מחדל<select value={age} onChange={e => setAge(Number(e.target.value) as Age)}>{[3,4,5,6].map(a => <option key={a}>{a}</option>)}</select></label><label>שמות או כינויים<textarea rows={5} maxLength={10000} value={names} onChange={e => { setNames(e.target.value); setPreview(false); }} /></label>
      {!preview ? <button disabled={busy || !rows.length} onClick={() => setPreview(true)}>תצוגה מקדימה</button> : <><p>{rows.length} ילדים להוספה, בגיל {age}</p><p>{rows.join(' · ')}</p>{duplicateNames.length > 0 && <p role="status">יש שמות חוזרים: {duplicateNames.join(', ')}. לכל ילד יוקצה מזהה נפרד.</p>}<button disabled={busy || rows.some(n => n.length > 30) || rows.length > 100} onClick={() => void run(async () => { for (const name of rows) createProfile({ name, age }); await localPersistence.flush(); setNames(''); setPreview(false); setRevision(v => v + 1); })}>אישור והוספת הילדים</button><button className="pilot-secondary" onClick={() => setPreview(false)}>עריכת הרשימה</button>{rows.some(n => n.length > 30) && <p role="alert">כל כינוי מוגבל ל־30 תווים.</p>}</>}
      </section>
      <section className="pilot-card pilot-card--wide"><h2>משחק משותף</h2><p>הצוות בוחר שני ילדים למשחק בתורות.</p><div className="pilot-actions">{[pairFirst,pairSecond].map((value,index) => <label key={index}>ילד {index + 1}<select value={value} onChange={e => index === 0 ? setPairFirst(e.target.value) : setPairSecond(e.target.value)}><option value="">בחירת ילד</option>{snapshot.profiles.map(p => <option key={p.id} value={p.id}>{p.name} · {p.id.slice(-6)}</option>)}</select></label>)}<button disabled={busy || !pairFirst || !pairSecond || pairFirst === pairSecond} onClick={() => void run(() => start(pairFirst, undefined, [pairFirst,pairSecond]))}>מתחילים יחד</button></div></section>
      <section className="pilot-card pilot-card--wide"><h2>הכנת המחשב ושמירה</h2><p>לפני משחק ללא רשת יש להכין את תוכני המשחק והקריינות, ולהשאיר את המחשב מחובר עד לסיום.</p><button disabled={busy || !online || !trusted} onClick={() => void run(async () => { await repo.refresh(); await preparePilotOffline(); setReady(true); setNotice('הילדים, המשחקים והקריינות מוכנים במחשב זה.'); })}>הכנת המחשב למשחק ללא רשת</button>
      {legacy && <button disabled={busy || !online} onClick={() => { if (confirm(`להעביר ${legacy.profiles.length} פרופילים מקומיים לגן הזה? המקור יישמר במחשב.`)) void run(async () => { await repo.importSnapshot(legacy); setLegacy(undefined); setRevision(v => v + 1); }); }}>העברת הפרופילים המקומיים לגן</button>}
      <button className="pilot-secondary" disabled={busy} onClick={() => void run(async () => { await repo.close(); await logout(); setAccount(undefined); setLegacy(undefined); })}>יציאה מהחשבון וניקוי נתוני הגן מהמחשב</button><button className="pilot-secondary" disabled={busy} onClick={() => { setStage('pin'); setPin(''); }}>נעילת אזור הצוות</button><button className="pilot-secondary" disabled={busy || !online} onClick={() => void run(async () => {
        await localPersistence.flush(); await repo.sync(); if (repo.getStatus().pending || repo.getStatus().error) throw new Error('יש להשלים גיבוי לפני עדכון הגרסה.');
        const registration = await navigator.serviceWorker?.getRegistration(); await registration?.update();
        if (!registration?.waiting) { setNotice('אין עדכון מוכן כרגע.'); return; }
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
      })}>בדיקת עדכון גרסה</button><a href="/pilot-guide.html">מדריך לגננת</a><a href="/privacy.html">פרטיות</a>
      </section></>}
    </main>}
    {stage === 'play' && <App key={playKey} pilotMode sharedParticipants={shared} onStaff={() => void run(staff)} />}
  </div>;
}
function SyncBanner({ repo, online, ready }: { repo: PilotRepository; online: boolean; ready: boolean }) {
  const status = useSyncExternalStore(repo.subscribe, repo.getStatus);
  const local = useSyncExternalStore(localPersistence.subscribe, localPersistence.getStatus);
  return <div className="pilot-sync" role="status"><span>{local.failed ? 'השמירה במחשב נכשלה' : local.pending ? 'שומרים במחשב…' : 'נשמר במחשב'}</span><span>{status.pending ? `${status.pending} פעולות ממתינות לגיבוי` : status.lastSyncedAt ? 'הגיבוי בענן מעודכן' : 'בודקים גיבוי'}</span><span>{online ? status.error ? 'הסנכרון נכשל · ניסיון נוסף בהמשך' : status.syncing ? 'מסנכרנים…' : 'מחובר לרשת' : 'ללא חיבור לרשת'}</span><span>{ready ? 'תוכן מוכן ללא רשת' : 'תוכן טרם הוכן ללא רשת'}</span></div>;
}
function SessionChooser({repo,profileId,busy,onStart,onCancel}:{repo:PilotRepository;profileId:string;busy:boolean;onStart:(sessionId?:string)=>void;onCancel:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const element=dialog.current;element?.showModal();return()=>element?.close();},[]);
  return <dialog ref={dialog} className="pilot-card pilot-session-dialog" aria-label="בחירת מפגש להמשך" onCancel={onCancel}><h2>ממשיכים מפגש קודם?</h2><p>קיימים מפגשים שמורים. בחרו איזה מהם להמשיך, או התחילו מפגש חדש.</p>{repo.sessionsFor(profileId).map((id,i)=><button key={id} disabled={busy} onClick={()=>onStart(id)}>המשך מפגש {i+1} · {repo.sessionLabel(profileId,id)}</button>)}<button disabled={busy} onClick={()=>onStart()}>מפגש חדש</button><button className="pilot-secondary" disabled={busy} onClick={onCancel}>ביטול</button></dialog>;
}
