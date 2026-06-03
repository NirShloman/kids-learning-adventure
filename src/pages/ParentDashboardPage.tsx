import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { GameSession, PlayerProfile } from '../types';
import { Button } from '../components/common/Button';
import { getGameLabel, getSessionsByPlayer } from '../services/playerProgressService';
import { pullProgressFromCloud, pushProgressToCloud } from '../services/cloudProgressRepository';
import { registerParent, signInParent, signOutParent, watchParentAuth } from '../services/parentAuthService';

interface ParentDashboardPageProps {
  players: PlayerProfile[];
  sessions: GameSession[];
  onBack: () => void;
  onProgressReplace: (players: PlayerProfile[], sessions: GameSession[]) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formatPercent(score: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((score / total) * 100)}%`;
}

function getSyncLabel(status: GameSession['syncStatus']): string {
  if (status === 'synced') return 'מגובה בענן';
  if (status === 'pending') return 'ממתין לסנכרון';
  return 'נשמר במכשיר';
}

export function ParentDashboardPage({ players, sessions, onBack, onProgressReplace }: ParentDashboardPageProps) {
  const [parentUser, setParentUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cloudMessage, setCloudMessage] = useState('הנתונים נשמרים כרגע במכשיר הזה.');
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const totalSessions = sessions.length;
  const totalStars = sessions.reduce((sum, session) => sum + session.stars, 0);
  const averageStars = totalSessions ? (totalStars / totalSessions).toFixed(1) : '0';

  useEffect(() => watchParentAuth((user) => setParentUser(user && !user.isAnonymous ? user : null)), []);

  async function handleParentAuth(mode: 'sign-in' | 'register') {
    setIsCloudBusy(true);
    setCloudMessage(mode === 'sign-in' ? 'מתחברים לחשבון ההורה...' : 'יוצרים חשבון הורה...');

    try {
      const user = mode === 'sign-in' ? await signInParent(email, password) : await registerParent(email, password);
      setParentUser(user);
      setCloudMessage('חשבון ההורה מחובר. אפשר לגבות או לטעון התקדמות מהענן.');
    } catch {
      setCloudMessage('לא הצלחנו להתחבר. ודאו ש-Email/Password Auth מופעל ב-Firebase ושהפרטים נכונים.');
    } finally {
      setIsCloudBusy(false);
    }
  }

  async function handlePushToCloud() {
    if (!parentUser) return;
    setIsCloudBusy(true);
    setCloudMessage('מגבים את ההתקדמות לענן...');

    try {
      const syncedSessions = await pushProgressToCloud(parentUser.uid, players, sessions);
      onProgressReplace(players, syncedSessions);
      setCloudMessage('ההתקדמות גובתה לענן בהצלחה.');
    } catch {
      setCloudMessage('הגיבוי נכשל. ודאו ש-Firestore נוצר ושכללי הגישה מאפשרים למשתמש מחובר לקרוא ולכתוב.');
    } finally {
      setIsCloudBusy(false);
    }
  }

  async function handlePullFromCloud() {
    if (!parentUser) return;
    setIsCloudBusy(true);
    setCloudMessage('טוענים התקדמות מהענן...');

    try {
      const cloudProgress = await pullProgressFromCloud(parentUser.uid);
      if (!cloudProgress.players.length) {
        setCloudMessage('לא נמצאו עדיין שחקנים בענן. אפשר לבצע גיבוי ראשון מהמכשיר הזה.');
        return;
      }
      onProgressReplace(cloudProgress.players, cloudProgress.sessions);
      setCloudMessage('ההתקדמות נטענה מהענן.');
    } catch {
      setCloudMessage('טעינה מהענן נכשלה. בדקו ש-Firestore פעיל ושכללי הגישה תקינים.');
    } finally {
      setIsCloudBusy(false);
    }
  }

  async function handleSignOut() {
    await signOutParent();
    setCloudMessage('התנתקתם מחשבון ההורה. הנתונים המקומיים נשארים במכשיר.');
  }

  return (
    <section className="parent-dashboard" dir="rtl">
      <div className="parent-dashboard__header">
        <div>
          <span className="question-card__tag">אזור הורים</span>
          <h2>מעקב התקדמות לפי שחקנים</h2>
          <p>כאן אפשר לראות איך כל ילד או ילדה מתקדמים בכל המשחקים, בלי לחץ ובלי דירוגים תחרותיים.</p>
        </div>
        <Button variant="ghost" onClick={onBack}>חזרה למשחקים</Button>
      </div>

      <div className="parent-dashboard__stats">
        <div>
          <strong>{players.length}</strong>
          <span>שחקנים</span>
        </div>
        <div>
          <strong>{totalSessions}</strong>
          <span>משחקים שהושלמו</span>
        </div>
        <div>
          <strong>{averageStars}</strong>
          <span>כוכבים בממוצע</span>
        </div>
      </div>

      <section className="parent-cloud-panel">
        <div>
          <span className="question-card__tag">גיבוי ענן</span>
          <h3>{parentUser ? `מחובר כ-${parentUser.email}` : 'חיבור חשבון הורה'}</h3>
          <p>{cloudMessage}</p>
        </div>

        {parentUser ? (
          <div className="parent-cloud-panel__actions">
            <Button type="button" onClick={handlePushToCloud} disabled={isCloudBusy}>גיבוי לענן</Button>
            <Button type="button" variant="secondary" onClick={handlePullFromCloud} disabled={isCloudBusy}>טעינה מהענן</Button>
            <Button type="button" variant="ghost" onClick={handleSignOut} disabled={isCloudBusy}>התנתקות</Button>
          </div>
        ) : (
          <form className="parent-cloud-panel__form" onSubmit={(event) => {
            event.preventDefault();
            if (!isCloudBusy && email && password.length >= 6) handleParentAuth('sign-in');
          }}>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="אימייל הורה" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="סיסמה" />
            <Button type="button" disabled={isCloudBusy || !email || password.length < 6} onClick={() => handleParentAuth('sign-in')}>כניסה</Button>
            <Button type="button" variant="secondary" disabled={isCloudBusy || !email || password.length < 6} onClick={() => handleParentAuth('register')}>הרשמה</Button>
          </form>
        )}
      </section>

      <div className="parent-dashboard__players">
        {players.map((player) => {
          const playerSessions = getSessionsByPlayer(sessions, player.id);
          const latestSession = playerSessions[0];
          const completedGames = new Set(playerSessions.map((session) => session.gameId)).size;
          const averageScore = playerSessions.length
            ? Math.round(playerSessions.reduce((sum, session) => sum + (session.score / session.total), 0) / playerSessions.length * 100)
            : 0;

          return (
            <article className="parent-player-card" key={player.id}>
              <div className="parent-player-card__top">
                <div>
                  <h3>{player.name}</h3>
                  <p>גיל {player.age} · {playerSessions.length} סיומי משחק</p>
                </div>
                <span>{playerSessions.reduce((sum, session) => sum + session.stars, 0)} כוכבים</span>
              </div>

              <div className="parent-player-card__metrics">
                <div>
                  <strong>{averageScore}%</strong>
                  <span>דיוק ממוצע</span>
                </div>
                <div>
                  <strong>{completedGames}</strong>
                  <span>סוגי משחקים</span>
                </div>
                <div>
                  <strong>{latestSession ? getGameLabel(latestSession.gameId) : 'אין עדיין'}</strong>
                  <span>פעילות אחרונה</span>
                </div>
              </div>

              {playerSessions.length ? (
                <div className="parent-player-card__history">
                  {playerSessions.slice(0, 5).map((session) => (
                    <div className="parent-session-row" key={session.id}>
                      <span>{getGameLabel(session.gameId)}</span>
                      <span>{formatPercent(session.score, session.total)}</span>
                      <span>{'★'.repeat(session.stars)}{'☆'.repeat(3 - session.stars)}</span>
                      <span className="parent-session-row__sync">{getSyncLabel(session.syncStatus)}</span>
                      <small>{formatDate(session.completedAt)}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="parent-player-card__empty">עדיין אין נתוני משחק. אחרי סיום משחק ראשון, ההתקדמות תופיע כאן.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
