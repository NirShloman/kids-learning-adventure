import { gameDefinitions } from '../data/games';
import { GameId, LearnerSettings } from '../types';
import { GameCard } from '../components/games/GameCard';
import { ageOptions, difficultyOptions } from '../data/levels';
import { useSpeech } from '../hooks/useSpeech';

interface HomePageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onSelectGame: (gameId: GameId) => void;
}

export function HomePage({ settings, onSettingsChange, onSelectGame }: HomePageProps) {
  const { getSpeakProps } = useSpeech(settings.voiceEnabled);

  return (
    <section className="home-page">
      <div className="settings-card settings-card--premium" aria-label="הגדרות משחק" {...getSpeakProps<HTMLDivElement>('כאן בוחרים גיל, רמת קושי והאם להפעיל קול הדרכה')}>
        <div>
          <h2>לפני שמתחילים</h2>
          <p>בחרו גיל, רמת קושי והאם להשמיע הוראות קוליות בכל האפליקציה.</p>
        </div>

        <div className="settings-grid">
          <label {...getSpeakProps<HTMLLabelElement>('בחירת גיל הילד או הילדה')}>
            גיל הילד/ה
            <select
              value={settings.age}
              onChange={(event) => onSettingsChange({ ...settings, age: Number(event.target.value) as LearnerSettings['age'] })}
            >
              {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
            </select>
          </label>

          <label {...getSpeakProps<HTMLLabelElement>('בחירת רמת קושי')}>
            רמת קושי
            <select
              value={settings.difficulty}
              onChange={(event) => onSettingsChange({ ...settings, difficulty: event.target.value as LearnerSettings['difficulty'] })}
            >
              {difficultyOptions.map((difficulty) => <option key={difficulty.id} value={difficulty.id}>{difficulty.label}</option>)}
            </select>
          </label>

          <label className="toggle-row" {...getSpeakProps<HTMLLabelElement>('הפעלת הוראות קוליות')}>
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked })}
            />
            הוראות קוליות
          </label>
        </div>
      </div>

      <section className="home-grid home-grid--premium" aria-label="בחירת משחק">
        {gameDefinitions.map((game) => <GameCard key={game.id} game={game} voiceEnabled={settings.voiceEnabled} onPlay={onSelectGame} />)}
      </section>
    </section>
  );
}
