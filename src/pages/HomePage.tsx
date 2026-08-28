import { gameDefinitions } from '../data/games';
import { GameId, LearnerSettings } from '../types';
import { GameCard } from '../components/games/GameCard';
import { AmbientVideo } from '../components/common/AmbientVideo';
import { Button } from '../components/common/Button';
import { JourneyMap } from '../components/learning/JourneyMap';

interface HomePageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onSelectGame: (gameId: GameId) => void;
  onStartAdaptive: () => void;
  onStartShared: () => void;
}

export function HomePage({ settings, onSettingsChange, onSelectGame, onStartAdaptive, onStartShared }: HomePageProps) {
  return (
    <section className="home-page">
      <AmbientVideo
        src="/assets/video/learning-garden-lobby.mp4"
        poster="/assets/video/learning-garden-lobby.poster.webp"
        className="home-cinematic"
        fallback={<div className="home-cinematic__fallback" />}
        ariaLabel="גן למידה צבעוני"
      >
        <section className="adaptive-entry" aria-labelledby="adaptive-entry-title">
          <div><span>המסלול האישי שלי</span><h2 id="adaptive-entry-title">תרגול קצר שמתאים את עצמו</h2><p>5–7 דקות של חזרה, תרגול ואתגר קטן — הכול נשמר רק במכשיר.</p></div>
          <Button onClick={onStartAdaptive}>מתחילים תרגול מותאם</Button>
        </section>
      </AmbientVideo>
      <div className="shared-entry"><Button variant="secondary" onClick={onStartShared}>משחקים יחד באותו מכשיר</Button></div>
      <JourneyMap onSelectWorld={onSelectGame} />
      <section className="game-menu-heading" aria-labelledby="game-menu-title">
        <div>
          <span>8 עולמות למידה</span>
          <h2 id="game-menu-title">בוחרים משחק ומתחילים</h2>
        </div>

        <div className="quick-settings" aria-label="הגדרות משחק">
          <label className="voice-toggle" htmlFor="learner-voice">
            <input
              id="learner-voice"
              type="checkbox"
              checked={settings.narrationEnabled}
              onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked, narrationEnabled: event.target.checked })}
            />
            <span aria-hidden="true">🔊</span>
            הקראה
          </label>

          <label className="voice-toggle" htmlFor="learner-sound-effects">
            <input
              id="learner-sound-effects"
              type="checkbox"
              checked={settings.soundEffectsEnabled}
              onChange={(event) => onSettingsChange({ ...settings, soundEffectsEnabled: event.target.checked })}
            />
            <span aria-hidden="true">🎵</span>
            צלילי משחק
          </label>

          <label className="voice-toggle" htmlFor="learner-music">
            <input
              id="learner-music"
              type="checkbox"
              checked={settings.musicEnabled}
              onChange={(event) => onSettingsChange({ ...settings, musicEnabled: event.target.checked })}
            />
            <span aria-hidden="true">🎶</span>
            מוזיקה
          </label>
        </div>
      </section>

      <section className="home-grid home-grid--premium" aria-label="בחירת משחק">
        {gameDefinitions.map((game) => <GameCard key={game.id} game={game} voiceEnabled={settings.voiceEnabled} onPlay={onSelectGame} />)}
      </section>
    </section>
  );
}
