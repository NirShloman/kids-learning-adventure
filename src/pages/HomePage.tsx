import { useEffect, useState } from 'react';
import { gameDefinitions } from '../data/games';
import { GameId, LearnerSettings } from '../types';
import { GameCard } from '../components/games/GameCard';
import { Button } from '../components/common/Button';
import { PageControls } from '../components/common/PageControls';
import { JourneyMap } from '../components/learning/JourneyMap';
import { DiscoveryCollection } from '../components/games/detective/DiscoveryCollection';
interface HomePageProps {
  settings: LearnerSettings;
  onSettingsChange: (settings: LearnerSettings) => void;
  onSelectGame: (gameId: GameId) => void;
  onStartAdaptive: () => void;
  onStartShared: () => void;
}
type View = 'games' | 'journey' | 'collection' | 'settings';
export function HomePage({ settings, onSettingsChange, onSelectGame, onStartAdaptive, onStartShared }: HomePageProps) {
  const [view, setView] = useState<View>('games');
  const [page, setPage] = useState(0);
  const [wide, setWide] = useState(() => matchMedia('(min-width: 900px) and (min-height: 650px)').matches);
  useEffect(() => {
    const query = matchMedia('(min-width: 900px) and (min-height: 650px)');
    const change = () => { setWide(query.matches); setPage(0); };
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  const count = wide ? 8 : 4;
  return <section className="home-page child-home" data-view={view}>
    <div className="home-view">
      {view === 'games' && <>
        <h2>בוחרים משחק ומתחילים</h2>
        <section className="home-grid home-grid--premium" aria-label="בחירת משחק">
          {gameDefinitions.slice(page * count, (page + 1) * count).map(game => <GameCard key={game.id} game={game} voiceEnabled={settings.voiceEnabled} onPlay={onSelectGame} />)}
        </section>
        <PageControls page={page} count={Math.ceil(gameDefinitions.length / count)} onChange={setPage} />
      </>}
      {view === 'journey' && <>
        <h2>המסלול האישי שלי</h2>
        <Button onClick={onStartAdaptive}>מתחילים תרגול מותאם</Button>
        <JourneyMap onSelectWorld={onSelectGame} />
      </>}
      {view === 'collection' && <DiscoveryCollection onPlay={onSelectGame} />}
      {view === 'settings' && <section className="child-settings">
        <h2>איך נשחק היום?</h2>
        {([
          ['narrationEnabled', '🔊 הקראה'], ['soundEffectsEnabled', '🎵 צלילי משחק'], ['musicEnabled', '🎶 מוזיקה'],
        ] as const).map(([key, label]) => <label key={key} className="voice-toggle">
          <input id={key === 'narrationEnabled' ? 'learner-voice' : `learner-${key}`} type="checkbox" checked={settings[key]} onChange={event => onSettingsChange({ ...settings, [key]: event.target.checked, ...(key === 'narrationEnabled' ? { voiceEnabled: event.target.checked } : {}) })} />{label}
        </label>)}
      </section>}
    </div>
    <nav className="child-nav" aria-label="העולמות שלי">
      <button aria-label="🎲 משחקים" onClick={() => setView('games')} aria-current={view === 'games' ? 'page' : undefined}><span>🎲</span>משחקים</button>
      <button aria-label="🌱 המסלול שלי" onClick={() => setView('journey')} aria-current={view === 'journey' ? 'page' : undefined}><span>🌱</span>המסלול שלי</button>
      <button aria-label="🤝 יחד" onClick={onStartShared}><span>🤝</span>יחד</button>
      <button aria-label="🏆 האוסף שלי" onClick={() => setView('collection')} aria-current={view === 'collection' ? 'page' : undefined}><span>🏆</span>האוסף שלי</button>
      <button aria-label="⚙️ צלילים" onClick={() => setView('settings')} aria-current={view === 'settings' ? 'page' : undefined}><span>⚙️</span>צלילים</button>
    </nav>
  </section>;
}
