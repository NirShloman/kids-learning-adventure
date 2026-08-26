import type { GameId } from '../../types';
import { getActiveProfile, getProfileData } from '../../services/learningStoreService';

interface JourneyMapProps { onSelectWorld: (gameId: GameId) => void }
const worlds: Array<{ id: Extract<GameId, 'letters' | 'numbers' | 'shapes' | 'colors'>; title: string; icon: string }> = [
  { id: 'letters', title: 'גן האותיות', icon: '🔤' }, { id: 'numbers', title: 'פרדס המספרים', icon: '🔢' },
  { id: 'shapes', title: 'סדנת הצורות', icon: '🟠' }, { id: 'colors', title: 'גינת הצבעים', icon: '🎨' }
];

export function JourneyMap({ onSelectWorld }: JourneyMapProps) {
  const profile = getActiveProfile(); if (!profile) return null;
  const journey = getProfileData(profile.id).journey;
  return <section className="journey-map" aria-labelledby="journey-map-title"><div><span>מסע מתמשך</span><h2 id="journey-map-title">מפת עולמות ההרפתקה</h2><p>כל משימה קצרה מחזקת מיומנות ופותחת את האזור הבא.</p></div><div className="journey-map__worlds">
    {worlds.map((world) => { const unlocked = journey.unlockedWorlds.includes(world.id); const completed = journey.completedLevelIds.some((id) => id.startsWith(world.id)); return <button key={world.id} disabled={!unlocked} onClick={() => onSelectWorld(world.id)}><span>{unlocked ? world.icon : '🔒'}</span><strong>{world.title}</strong><small>{completed ? 'נאסף פריט קישוט' : unlocked ? 'פתוח למסע' : 'ייפתח בהמשך'}</small></button>; })}
  </div></section>;
}
