import { gameDefinitions } from '../data/games';
import { GameId, LearnerSettings } from '../types';
import { GameCard } from '../components/games/GameCard';
import { ageOptions, difficultyOptions, getDefaultDifficultyByAge } from '../data/levels';
import { SelectField } from '../components/common/SelectField';

interface HomePageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onSelectGame: (gameId: GameId) => void;
}

export function HomePage({ settings, onSettingsChange, onSelectGame }: HomePageProps) {
  function handleAgeChange(age: LearnerSettings['age']) {
    onSettingsChange({ ...settings, age, difficulty: getDefaultDifficultyByAge(age) });
  }

  return (
    <section className="home-page">
      <section className="game-menu-heading" aria-labelledby="game-menu-title">
        <div>
          <span>8 עולמות למידה</span>
          <h2 id="game-menu-title">בוחרים משחק ומתחילים</h2>
        </div>

        <div className="quick-settings" aria-label="הגדרות משחק">
          <SelectField
            id="learner-age"
            label="גיל"
            value={settings.age}
            onChange={(event) => handleAgeChange(Number(event.target.value) as LearnerSettings['age'])}
          >
            {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
          </SelectField>

          <SelectField
            id="learner-difficulty"
            label="רמה"
            value={settings.difficulty}
            onChange={(event) => onSettingsChange({ ...settings, difficulty: event.target.value as LearnerSettings['difficulty'] })}
          >
            {difficultyOptions.map((difficulty) => <option key={difficulty.id} value={difficulty.id}>{difficulty.label}</option>)}
          </SelectField>

          <label className="voice-toggle" htmlFor="learner-voice">
            <input
              id="learner-voice"
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked })}
            />
            <span aria-hidden="true">🔊</span>
            קול
          </label>
        </div>
      </section>

      <section className="home-grid home-grid--premium" aria-label="בחירת משחק">
        {gameDefinitions.map((game) => <GameCard key={game.id} game={game} voiceEnabled={settings.voiceEnabled} onPlay={onSelectGame} />)}
      </section>
    </section>
  );
}
