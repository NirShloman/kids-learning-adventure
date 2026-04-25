import { LearnerSettings } from '../types';
import { gameDefinitions } from '../data/games';
import { ageOptions, difficultyOptions } from '../data/levels';
import { BrandLogo } from '../components/common/BrandLogo';

interface LandingPageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onStart: () => void;
}

const lobbyStops = [
  { icon: '🌈', label: 'אותיות', text: 'מגלים צלילים ומילים ראשונות' },
  { icon: '🧮', label: 'מספרים', text: 'סופרים, משווים ובוחרים תשובה' },
  { icon: '🎨', label: 'צבעים וצורות', text: 'משחקים עם צבעים, צורות ותמונות' }
];

const lobbyBadges = [
  { value: '6', label: 'משחקים' },
  { value: '3-6', label: 'גילאים' },
  { value: 'עברית', label: 'מלאה' }
];

export function LandingPage({ settings, onSettingsChange, onStart }: LandingPageProps) {
  const selectedDifficulty = difficultyOptions.find((difficulty) => difficulty.id === settings.difficulty) ?? difficultyOptions[0];
  const previewGames = gameDefinitions.slice(0, 6);

  return (
    <section className="landing-lobby" dir="rtl">
      <div className="landing-lobby__sky" aria-hidden="true">
        <span className="landing-lobby__cloud landing-lobby__cloud--one"></span>
        <span className="landing-lobby__cloud landing-lobby__cloud--two"></span>
        <span className="landing-lobby__letter landing-lobby__letter--one">א</span>
        <span className="landing-lobby__letter landing-lobby__letter--two">5</span>
        <span className="landing-lobby__letter landing-lobby__letter--three">★</span>
      </div>

      <header className="landing-lobby__topbar">
        <BrandLogo className="landing-lobby__brand-logo" tagline="לובי הרפתקאות הלמידה" />
        <span className="landing-lobby__top-note">לובי לפני תפריט המשחקים</span>
      </header>

      <div className="landing-lobby__shell">
        <div className="landing-lobby__hero">
          <div className="landing-lobby__copy">
            <span className="landing-lobby__badge">לובי הרפתקאות הלמידה</span>
            <h1 className="landing-lobby__title">בוחרים מסלול, פותחים שער, ומתחילים לשחק</h1>
            <p className="landing-lobby__lead">
              רגע לפני תפריט המשחקים, מכוונים את החוויה לילד או לילדה ונכנסים לעולם צבעוני של אותיות, מספרים, צבעים, צורות וזיכרון.
            </p>

            <div className="landing-lobby__badges" aria-label="פרטי הלובי">
              {lobbyBadges.map((badge) => (
                <div className="landing-lobby__stat" key={badge.label}>
                  <strong>{badge.value}</strong>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>

            <div className="landing-lobby__actions">
              <button type="button" className="landing-lobby__start" onClick={onStart}>
                כניסה לתפריט המשחקים
              </button>
              <span className="landing-lobby__age-note">ההגדרות שבוחרים כאן נשמרות למסך הבא</span>
            </div>
          </div>

          <div className="landing-lobby__stage" aria-label="איור של לובי המשחקים">
            <div className="landing-lobby__portal">
              <span className="landing-lobby__portal-sign">תפריט המשחקים</span>
              <div className="landing-lobby__portal-grid">
                {previewGames.slice(0, 4).map((game) => (
                  <span className={`landing-lobby__portal-tile landing-lobby__portal-tile--${game.accent}`} key={game.id}>
                    {game.emoji}
                  </span>
                ))}
              </div>
              <div className="landing-lobby__portal-floor"></div>
            </div>

            <div className="landing-lobby__path" aria-label="תחנות בלובי">
              {lobbyStops.map((stop, index) => (
                <article className="landing-lobby__stop" key={stop.label}>
                  <span aria-hidden="true">{stop.icon}</span>
                  <div>
                    <strong>{index + 1}. {stop.label}</strong>
                    <p>{stop.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <section className="landing-lobby__route" aria-label="מסלול קצר לפני המשחקים">
          <article>
            <span aria-hidden="true">🎯</span>
            <div>
              <h2>מכוונים</h2>
              <p>בוחרים גיל, רמת קושי וקול הדרכה.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">🗺️</span>
            <div>
              <h2>נכנסים</h2>
              <p>פותחים את תפריט המשחקים המלא.</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">🏆</span>
            <div>
              <h2>מתקדמים</h2>
              <p>צוברים כוכבים דרך משחקים קצרים.</p>
            </div>
          </article>
        </section>

        <div className="landing-lobby__lower">
          <section className="landing-lobby__control-panel" aria-label="הגדרות לפני התחלה">
            <div className="landing-lobby__panel-heading">
              <span aria-hidden="true">🎒</span>
              <div>
                <h2>הכנת המסלול</h2>
                <p>הבחירות האלה יישמרו כשנגיע לתפריט המשחקים.</p>
              </div>
            </div>

            <div className="landing-lobby__settings">
              <label className="landing-lobby__field" htmlFor="landing-age-select">
                גיל
                <select
                  id="landing-age-select"
                  value={settings.age}
                  onChange={(event) => onSettingsChange({ ...settings, age: Number(event.target.value) as LearnerSettings['age'] })}
                >
                  {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
                </select>
              </label>

              <fieldset className="landing-lobby__difficulty">
                <legend>רמת קושי</legend>
                <div className="landing-lobby__difficulty-options">
                  {difficultyOptions.map((difficulty) => (
                    <label
                      className={`landing-lobby__chip${settings.difficulty === difficulty.id ? ' landing-lobby__chip--active' : ''}`}
                      key={difficulty.id}
                    >
                      <input
                        type="radio"
                        name="landing-difficulty"
                        value={difficulty.id}
                        checked={settings.difficulty === difficulty.id}
                        onChange={() => onSettingsChange({ ...settings, difficulty: difficulty.id })}
                      />
                      {difficulty.label}
                    </label>
                  ))}
                </div>
                <p>{selectedDifficulty.description}</p>
              </fieldset>

              <label className="landing-lobby__voice" htmlFor="landing-voice-toggle">
                <input
                  id="landing-voice-toggle"
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked })}
                />
                <span>🔊 קול הדרכה</span>
              </label>
            </div>
          </section>

          <section className="landing-lobby__preview" aria-label="מה מחכה בתפריט">
            <div className="landing-lobby__preview-heading">
              <h2>מה מחכה בפנים?</h2>
              <p>הצצה קטנה לפני שפותחים את התפריט.</p>
            </div>
            <div className="landing-lobby__preview-grid">
              {previewGames.map((game) => (
                <div className={`landing-lobby__mini-game landing-lobby__mini-game--${game.accent}`} key={game.id}>
                  <span>{game.emoji}</span>
                  <strong>{game.title}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
