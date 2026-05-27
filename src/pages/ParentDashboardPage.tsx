import { GameSession, PlayerProfile } from '../types';
import { Button } from '../components/common/Button';
import { getGameLabel, getSessionsByPlayer } from '../services/playerProgressService';

interface ParentDashboardPageProps {
  players: PlayerProfile[];
  sessions: GameSession[];
  onBack: () => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formatPercent(score: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((score / total) * 100)}%`;
}

export function ParentDashboardPage({ players, sessions, onBack }: ParentDashboardPageProps) {
  const totalSessions = sessions.length;
  const totalStars = sessions.reduce((sum, session) => sum + session.stars, 0);
  const averageStars = totalSessions ? (totalStars / totalSessions).toFixed(1) : '0';

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
