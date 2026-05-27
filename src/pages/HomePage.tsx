import { gameDefinitions } from '../data/games';
import { GameId, LearnerSettings, PlayerProfile } from '../types';
import { GameCard } from '../components/games/GameCard';
import { ageOptions, difficultyOptions } from '../data/levels';
import { useSpeech } from '../hooks/useSpeech';
import { Button } from '../components/common/Button';
import { useState } from 'react';

interface HomePageProps {
  settings: LearnerSettings;
  players: PlayerProfile[];
  activePlayer: PlayerProfile;
  onSettingsChange: (settings: LearnerSettings) => void;
  onAddPlayer: (name: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onShowParentArea: () => void;
  onSelectGame: (gameId: GameId) => void;
}

const learningPathByAge: Record<LearnerSettings['age'], GameId[]> = {
  3: ['colors', 'shapes', 'memory'],
  4: ['letters', 'numbers', 'matching'],
  5: ['letters', 'patterns', 'sorting'],
  6: ['numbers', 'patterns', 'sorting']
};

export function HomePage({ settings, players, activePlayer, onSettingsChange, onAddPlayer, onSelectPlayer, onShowParentArea, onSelectGame }: HomePageProps) {
  const { getSpeakProps } = useSpeech(settings.voiceEnabled);
  const [newPlayerName, setNewPlayerName] = useState('');
  const recommendedPath = learningPathByAge[settings.age]
    .map((gameId) => gameDefinitions.find((game) => game.id === gameId))
    .filter((game): game is (typeof gameDefinitions)[number] => Boolean(game));

  function handleAddPlayer() {
    onAddPlayer(newPlayerName);
    setNewPlayerName('');
  }

  return (
    <section className="home-page">
      <section className="player-zone" aria-label="בחירת שחקן">
        <div className="player-zone__active" {...getSpeakProps<HTMLDivElement>(`השחקן הפעיל הוא ${activePlayer.name}`)}>
          <span>השחקן הפעיל</span>
          <strong>{activePlayer.name}</strong>
          <small>גיל {activePlayer.age}</small>
        </div>

        <label className="player-zone__select" {...getSpeakProps<HTMLLabelElement>('בחירת שחקן או שחקנית')}>
          בחירת שחקן
          <select value={activePlayer.id} onChange={(event) => onSelectPlayer(event.target.value)}>
            {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
          </select>
        </label>

        <div className="player-zone__new">
          <input
            aria-label="שם שחקן חדש"
            value={newPlayerName}
            onChange={(event) => setNewPlayerName(event.target.value)}
            placeholder="שם שחקן חדש"
          />
          <Button type="button" variant="secondary" onClick={handleAddPlayer}>הוספה</Button>
        </div>

        <Button type="button" variant="ghost" onClick={onShowParentArea}>אזור הורים</Button>
      </section>

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

      <section className="learning-path" aria-label="מסלול למידה מומלץ" {...getSpeakProps<HTMLElement>(`מסלול מומלץ לגיל ${settings.age}. שלוש תחנות קצרות לבניית ביטחון לפני קריאה`)}>
        <div className="learning-path__intro">
          <span className="learning-path__eyebrow">מסלול מומלץ</span>
          <h2>שלוש תחנות קצרות לבניית ביטחון</h2>
          <p>המסלול מתאים לגיל שבחרתם ומשלב זיהוי, חשיבה ומשחק עצמאי עם קול מנחה.</p>
        </div>

        <div className="learning-path__steps">
          {recommendedPath.map((game, index) => (
            <button
              className={`learning-path__step learning-path__step--${game.accent}`}
              key={game.id}
              type="button"
              onClick={() => onSelectGame(game.id)}
              {...getSpeakProps<HTMLButtonElement>(`תחנה ${index + 1}: ${game.title}. ${game.description}`)}
            >
              <span className="learning-path__number">{index + 1}</span>
              <span className="learning-path__icon" aria-hidden="true">{game.emoji}</span>
              <span>
                <strong>{game.title}</strong>
                <small>{game.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="home-grid home-grid--premium" aria-label="בחירת משחק">
        {gameDefinitions.map((game) => <GameCard key={game.id} game={game} voiceEnabled={settings.voiceEnabled} onPlay={onSelectGame} />)}
      </section>
    </section>
  );
}
