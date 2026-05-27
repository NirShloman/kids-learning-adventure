import { LearnerSettings } from '../types';
import { gameDefinitions } from '../data/games';
import { ageOptions, difficultyOptions } from '../data/levels';
import { BrandLogo } from '../components/common/BrandLogo';
import { useSpeech } from '../hooks/useSpeech';
import { gameInstructions } from '../data/gameInstructions';

interface LandingPageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onStart: () => void;
}

const lobbySteps = [
  { icon: '🎒', label: 'בוחרים גיל', speech: 'בוחרים את גיל הילד או הילדה' },
  { icon: '🌟', label: 'מכוונים רמה', speech: 'מכוונים רמת קושי שמתאימה לגיל' },
  { icon: '🔊', label: 'קול הדרכה', speech: 'מפעילים קול הדרכה שעוזר לילדים שלא קוראים עדיין' },
  { icon: '🚀', label: 'מתחילים לשחק', speech: 'נכנסים לתפריט המשחקים ומתחילים ללמוד בכיף' }
];

export function LandingPage({ settings, onSettingsChange, onStart }: LandingPageProps) {
  const { speak, getSpeakProps } = useSpeech(settings.voiceEnabled);
  const selectedDifficulty = difficultyOptions.find((difficulty) => difficulty.id === settings.difficulty) ?? difficultyOptions[0];
  const previewGames = gameDefinitions;

  function handleStart() {
    speak('נכנסים לתפריט המשחקים. בחרו משחק והתחילו ללמוד בכיף.');
    onStart();
  }

  return (
    <section className="landing-lobby landing-lobby--premium" dir="rtl">
      <div className="landing-lobby__sky" aria-hidden="true">
        <span className="landing-lobby__cloud landing-lobby__cloud--one"></span>
        <span className="landing-lobby__cloud landing-lobby__cloud--two"></span>
        <span className="landing-lobby__cloud landing-lobby__cloud--three"></span>
        <span className="landing-lobby__letter landing-lobby__letter--one">א</span>
        <span className="landing-lobby__letter landing-lobby__letter--two">5</span>
        <span className="landing-lobby__letter landing-lobby__letter--three">★</span>
        <span className="landing-lobby__spark landing-lobby__spark--one">✦</span>
        <span className="landing-lobby__spark landing-lobby__spark--two">✧</span>
      </div>

      <header className="landing-lobby__topbar">
        <BrandLogo className="landing-lobby__brand-logo" tagline="לובי המשחקים" />
        <span className="landing-lobby__top-note">חוויה עברית לילדים בגילאי 3–6</span>
      </header>

      <div className="landing-lobby__shell">
        <main className="landing-lobby__room" aria-label="לובי לפני תפריט המשחקים">
          <section className="landing-lobby__playroom">
            <div className="landing-lobby__copy">
              <span className="landing-lobby__badge">לובי משחקים משודרג</span>
              <h1 className="landing-lobby__title">נכנסים לעולם למידה צבעוני</h1>
              <p className="landing-lobby__lead">מסך פתיחה קצר, ברור ומזמין: בוחרים גיל, רמה וקול הדרכה — ומשם עוברים לתפריט משחקים עשיר.</p>

              <div className="landing-lobby__steps" aria-label="תחנות קצרות בלובי">
                {lobbySteps.map((step) => (
                  <span className="landing-lobby__step" key={step.label} tabIndex={0} {...getSpeakProps<HTMLSpanElement>(step.speech)}>
                    <span aria-hidden="true">{step.icon}</span>
                    {step.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="landing-lobby__stage" aria-label="שער לתפריט המשחקים">
              <div className="landing-lobby__mascot" aria-hidden="true">
                <div className="landing-lobby__mascot-face">😊</div>
                <div className="landing-lobby__mascot-book">א 1</div>
              </div>
              <div className="landing-lobby__portal">
                <span className="landing-lobby__portal-sign">תפריט המשחקים</span>
                <div className="landing-lobby__portal-grid">
                  {previewGames.slice(0, 6).map((game) => (
                    <span className={`landing-lobby__portal-tile landing-lobby__portal-tile--${game.accent}`} key={game.id}>
                      {game.emoji}
                    </span>
                  ))}
                </div>
                <div className="landing-lobby__portal-floor"></div>
              </div>
            </div>

            <div className="landing-lobby__game-shelf" aria-label="משחקים שמחכים בתפריט">
              {previewGames.map((game) => (
                <div className={`landing-lobby__mini-game landing-lobby__mini-game--${game.accent}`} key={game.id} tabIndex={0} {...getSpeakProps<HTMLDivElement>(gameInstructions[game.id].hoverText)}>
                  <span>{game.emoji}</span>
                  <strong>{game.title}</strong>
                </div>
              ))}
            </div>
          </section>

          <aside className="landing-lobby__control-panel" aria-label="הגדרות לפני כניסה">
            <div className="landing-lobby__panel-heading">
              <span aria-hidden="true">✨</span>
              <div>
                <h2>לפני שנכנסים</h2>
                <p>הבחירות נשמרות גם בתפריט המשחקים.</p>
              </div>
            </div>

            <div className="landing-lobby__settings">
              <label className="landing-lobby__field" htmlFor="landing-age-select" {...getSpeakProps<HTMLLabelElement>('בחרו גיל') }>
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
                      {...getSpeakProps<HTMLLabelElement>(`${difficulty.label}. ${difficulty.description}`)}
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

              <label className="landing-lobby__voice" htmlFor="landing-voice-toggle" {...getSpeakProps<HTMLLabelElement>('קול הדרכה בכל האפליקציה')}>
                <input
                  id="landing-voice-toggle"
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked })}
                />
                <span>קול הדרכה בכל האפליקציה</span>
              </label>
            </div>

            <button type="button" className="landing-lobby__start" onClick={handleStart} {...getSpeakProps<HTMLButtonElement>('כניסה לתפריט המשחקים')}>
              כניסה לתפריט המשחקים
            </button>
          </aside>
        </main>
      </div>
    </section>
  );
}
