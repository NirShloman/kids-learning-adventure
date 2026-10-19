import { useEffect, useState } from 'react';
import { gameDefinitions } from '../data/games';
import { GameId, LearnerSettings } from '../types';
import { GameCard } from '../components/games/GameCard';
import { Button } from '../components/common/Button';
import { PageControls } from '../components/common/PageControls';
import { JourneyMap } from '../components/learning/JourneyMap';
import { DiscoveryCollection } from '../components/games/detective/DiscoveryCollection';
import { InterfaceIcon } from '../components/common/InterfaceIcon';
import { getActiveProfile, getLearningSnapshot, getProfileData } from '../services/learningStoreService';
import { worldCollection, worldProgress } from '../data/worldCollection';
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
  const snapshot = getLearningSnapshot();
  const profile = getActiveProfile(snapshot);
  const data = profile ? getProfileData(profile.id, snapshot) : null;
  const savedRound = data?.detectives?.rounds.mixed;
  const hasSavedRound = Boolean(savedRound && savedRound.index < savedRound.steps.length && savedRound.age === settings.age && savedRound.difficulty === settings.difficulty);
  const discoveries = data ? worldCollection.reduce((sum, world) => sum + worldProgress(data, world.gameId).count, 0) : 0;
  const hasPractice = Boolean(data && (data.events.length || data.sessions.length));
  return <section className="home-page child-home" data-view={view}>
    <div className="home-view">
      {view === 'games' && <>
        <section className="next-adventure" aria-labelledby="next-adventure-title">
          <div className="next-adventure__copy">
            <span className="ui-eyebrow"><InterfaceIcon name="spark" />ההרפתקה שלך, בקצב שלך</span>
            <h2 id="next-adventure-title">{profile?.name ? `היי ${profile.name}, כיף שחזרת!` : 'איזה כיף לגלות יחד!'}</h2>
            <p>{hasSavedRound ? 'התגלית שלך מחכה. נמשיך מהמקום ששמרנו?' : hasPractice ? 'עוד צעד קטן במסלול שמתאים לך.' : 'אותיות, צבעים והמון הפתעות. מתחילים בצעד קטן.'}</p>
            <Button onClick={onStartAdaptive} className="next-adventure__action"><InterfaceIcon name="play" />{hasSavedRound ? 'ממשיכים לגלות' : hasPractice ? 'ממשיכים בהרפתקה' : 'יוצאים להרפתקה'}</Button>
          </div>
          <div className="next-adventure__art" aria-hidden="true"><img src="/assets/worlds/matching.webp" alt="" /><span><InterfaceIcon name="spark" />כל צעד הוא גילוי חדש</span></div>
        </section>
        <div className="home-section-heading"><h2>מה נגלה היום?</h2><span>{discoveries > 0 ? `${discoveries} תגליות באוסף שלך` : 'עולמות קטנים, תגליות גדולות'}</span></div>
        <section className="home-grid home-grid--premium" aria-label="בחירת משחק">
          {gameDefinitions.slice(page * count, (page + 1) * count).map(game => <GameCard key={game.id} game={game} voiceEnabled={settings.voiceEnabled} onPlay={onSelectGame} discoveries={data ? worldProgress(data, game.id).count : 0} />)}
        </section>
        <PageControls page={page} count={Math.ceil(gameDefinitions.length / count)} onChange={setPage} />
      </>}
      {view === 'journey' && <>
        <div className="home-section-heading"><div><span className="ui-eyebrow">צעד קטן בכל פעם</span><h2>המסלול האישי שלי</h2></div><InterfaceIcon name="path" /></div>
        <div className="journey-invitation"><p>מגלים, מתנסים וצומחים. כל אחד בקצב שלו.</p><Button onClick={onStartAdaptive}><InterfaceIcon name="play" />מתחילים תרגול מותאם</Button></div>
        <JourneyMap onSelectWorld={onSelectGame} />
      </>}
      {view === 'collection' && <DiscoveryCollection onPlay={onSelectGame} />}
      {view === 'settings' && <section className="child-settings">
        <h2>איך נשחק היום?</h2>
        <p>אפשר לבחור מה לשמוע בזמן המשחק.</p>
        {([
          ['narrationEnabled', '🔊 הקראה'], ['soundEffectsEnabled', '🎵 צלילי משחק'], ['musicEnabled', '🎶 מוזיקה'],
        ] as const).map(([key, label]) => <label key={key} className="voice-toggle">
          <span>{label}</span><input id={key === 'narrationEnabled' ? 'learner-voice' : `learner-${key}`} type="checkbox" role="switch" checked={settings[key]} onChange={event => onSettingsChange({ ...settings, [key]: event.target.checked, ...(key === 'narrationEnabled' ? { voiceEnabled: event.target.checked } : {}) })} />
        </label>)}
      </section>}
    </div>
    <nav className="child-nav" aria-label="העולמות שלי">
      <button aria-label="🎲 משחקים" onClick={() => setView('games')} aria-current={view === 'games' ? 'page' : undefined}><InterfaceIcon name="games" />משחקים</button>
      <button aria-label="🌱 המסלול שלי" onClick={() => setView('journey')} aria-current={view === 'journey' ? 'page' : undefined}><InterfaceIcon name="path" />המסלול שלי</button>
      <button aria-label="🤝 יחד" onClick={onStartShared}><InterfaceIcon name="people" />יחד</button>
      <button aria-label="🏆 האוסף שלי" onClick={() => setView('collection')} aria-current={view === 'collection' ? 'page' : undefined}><InterfaceIcon name="collection" />האוסף שלי</button>
      <button aria-label="⚙️ צלילים" onClick={() => setView('settings')} aria-current={view === 'settings' ? 'page' : undefined}><InterfaceIcon name="sound" />צלילים</button>
    </nav>
  </section>;
}
