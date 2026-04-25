import { LearnerSettings } from '../types';

interface LandingPageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onStart: () => void;
}

export function LandingPage({ settings, onSettingsChange, onStart }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-page__content">
        <div className="landing-page__header">
          <span className="landing-page__emoji">🎈</span>
          <h1 className="landing-page__title">לומדים בכיף</h1>
          <p className="landing-page__tagline">משחקי למידה צבעוניים ומהנים בעברית</p>
        </div>

        <div className="landing-page__characters">
          <span className="landing-page__char" role="img" aria-label="כוכב">⭐</span>
          <span className="landing-page__char" role="img" aria-label="לב">❤️</span>
          <span className="landing-page__char" role="img" aria-label="שמש">☀️</span>
          <span className="landing-page__char" role="img" aria-label="רקטה">🚀</span>
          <span className="landing-page__char" role="img" aria-label="פרפר">🦋</span>
        </div>

        <div className="landing-page__settings">
          <label className="landing-page__label" htmlFor="landing-age-select">
            <span>גיל:</span>
            <select
              id="landing-age-select"
              value={settings.age}
              onChange={(event) => onSettingsChange({ ...settings, age: Number(event.target.value) as LearnerSettings['age'] })}
              className="landing-page__select"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
            </select>
          </label>

          <label className="landing-page__label" htmlFor="landing-voice-toggle">
            <input
              id="landing-voice-toggle"
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked })}
              className="landing-page__checkbox"
            />
            <span>🔊 קול</span>
          </label>
        </div>

        <button type="button" className="landing-page__btn" onClick={onStart}>
          בואו נתחיל! 🎮
        </button>

        <p className="landing-page__age-note">מתאים לגילאי 3-6</p>
      </div>

      <div className="landing-page__decoration landing-page__decoration--1"></div>
      <div className="landing-page__decoration landing-page__decoration--2"></div>
      <div className="landing-page__decoration landing-page__decoration--3"></div>
    </div>
  );
}