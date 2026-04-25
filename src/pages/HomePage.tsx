import { gameDefinitions } from '../data/games';
import { GameId, LearnerSettings } from '../types';
import { GameCard } from '../components/games/GameCard';
import { ageOptions, difficultyOptions } from '../data/levels';

interface HomePageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onSelectGame: (gameId: GameId) => void;
}

export function HomePage({ settings, onSettingsChange, onSelectGame }: HomePageProps) {
  return (
    <section className="home-page">
      <div className="settings-card" aria-label="הגדרות משחק">
        <div>
          <h2>לפני שמתחילים</h2>
          <p>בחרו גיל, רמת קושי והאם להשמיע הוראות קוליות.</p>
        </div>

        <div className="settings-grid">
          <label>
            גיל הילד/ה
            <select
              value={settings.age}
              onChange={(event) => onSettingsChange({ ...settings, age: Number(event.target.value) as LearnerSettings['age'] })}
            >
              {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
            </select>
          </label>

          <label>
            רמת קושי
            <select
              value={settings.difficulty}
              onChange={(event) => onSettingsChange({ ...settings, difficulty: event.target.value as LearnerSettings['difficulty'] })}
            >
              {difficultyOptions.map((difficulty) => <option key={difficulty.id} value={difficulty.id}>{difficulty.label}</option>)}
            </select>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked })}
            />
            הוראות קוליות
          </label>
        </div>
      </div>

      <section className="home-grid" aria-label="בחירת משחק">
        {gameDefinitions.map((game) => <GameCard key={game.id} game={game} onPlay={onSelectGame} />)}
      </section>
    </section>
  );
}
