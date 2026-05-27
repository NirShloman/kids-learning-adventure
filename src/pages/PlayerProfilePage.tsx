import { useState } from 'react';
import { Age, Difficulty, LearnerSettings, PlayerProfile } from '../types';
import { ageOptions, difficultyOptions, getDefaultDifficultyByAge } from '../data/levels';
import { Button } from '../components/common/Button';

interface PlayerProfilePageProps {
  players: PlayerProfile[];
  activePlayer: PlayerProfile;
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onAddPlayer: (name: string, age: Age, difficulty: Difficulty) => void;
  onSelectPlayer: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onBack: () => void;
}

export function PlayerProfilePage({ players, activePlayer, settings, onSettingsChange, onAddPlayer, onSelectPlayer, onDeletePlayer, onBack }: PlayerProfilePageProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAge, setNewPlayerAge] = useState<Age>(settings.age);
  const [newPlayerDifficulty, setNewPlayerDifficulty] = useState<Difficulty>(settings.difficulty);

  function handleActiveAgeChange(age: Age) {
    onSettingsChange({
      ...settings,
      age,
      difficulty: getDefaultDifficultyByAge(age)
    });
  }

  function handleNewPlayerAgeChange(age: Age) {
    setNewPlayerAge(age);
    setNewPlayerDifficulty(getDefaultDifficultyByAge(age));
  }

  function handleAddPlayer() {
    onAddPlayer(newPlayerName, newPlayerAge, newPlayerDifficulty);
    setNewPlayerName('');
  }

  function handleDeleteActivePlayer() {
    const shouldDelete = window.confirm(`למחוק את ${activePlayer.name} ואת נתוני ההתקדמות שלו/ה מהמכשיר הזה?`);
    if (!shouldDelete) return;
    onDeletePlayer(activePlayer.id);
  }

  return (
    <section className="player-profile-page" dir="rtl">
      <div className="player-profile-page__header">
        <div>
          <span className="question-card__tag">פרופיל שחקן</span>
          <h2>מי משחק עכשיו?</h2>
          <p>בחרו שחקן, התאימו גיל ורמת קושי, או הוסיפו פרופיל חדש לילד/ה נוסף/ת.</p>
        </div>
        <Button variant="ghost" onClick={onBack}>חזרה למשחקים</Button>
      </div>

      <div className="player-profile-grid">
        <section className="player-profile-card">
          <h3>השחקן הפעיל</h3>
          <div className="player-profile-card__active">
            <strong>{activePlayer.name}</strong>
            <span>גיל {activePlayer.age} · {difficultyOptions.find((difficulty) => difficulty.id === activePlayer.difficulty)?.label}</span>
          </div>

          <label>
            בחירת שחקן
            <select value={activePlayer.id} onChange={(event) => onSelectPlayer(event.target.value)}>
              {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
            </select>
          </label>

          <div className="player-profile-card__settings">
            <label>
              גיל
              <select value={settings.age} onChange={(event) => handleActiveAgeChange(Number(event.target.value) as Age)}>
                {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
              </select>
            </label>

            <label>
              רמת קושי
              <select value={settings.difficulty} onChange={(event) => onSettingsChange({ ...settings, difficulty: event.target.value as Difficulty })}>
                {difficultyOptions.map((difficulty) => <option key={difficulty.id} value={difficulty.id}>{difficulty.label}</option>)}
              </select>
            </label>
          </div>

          <Button type="button" variant="secondary" onClick={handleDeleteActivePlayer}>מחיקת השחקן הפעיל</Button>
        </section>

        <section className="player-profile-card">
          <h3>הוספת שחקן חדש</h3>
          <label>
            שם
            <input value={newPlayerName} onChange={(event) => setNewPlayerName(event.target.value)} placeholder="שם שחקן חדש" />
          </label>

          <div className="player-profile-card__settings">
            <label>
              גיל
              <select value={newPlayerAge} onChange={(event) => handleNewPlayerAgeChange(Number(event.target.value) as Age)}>
                {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
              </select>
            </label>

            <label>
              רמת קושי
              <select value={newPlayerDifficulty} onChange={(event) => setNewPlayerDifficulty(event.target.value as Difficulty)}>
                {difficultyOptions.map((difficulty) => <option key={difficulty.id} value={difficulty.id}>{difficulty.label}</option>)}
              </select>
            </label>
          </div>

          <Button type="button" onClick={handleAddPlayer}>הוספת שחקן</Button>
        </section>
      </div>
    </section>
  );
}
