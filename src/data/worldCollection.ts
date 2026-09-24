import type { ProfileLearningData } from '../types';
import type { DiscoveryScope } from '../types/detective.types';

export interface CollectionWorld {
  gameId: DiscoveryScope;
  name: string;
  companion: string;
  keepsake: string;
  story: string;
  color: string;
  art: string;
}

export const worldCollection: CollectionWorld[] = [
  { gameId: 'letters', name: 'הספרייה הקסומה', companion: 'ינשוף הסיפורים', keepsake: 'מפתח הסיפורים', story: 'בין ענפי הספרייה גר ינשוף קטן. כל אות שמגלים פותחת דלת לסיפור חדש.', color: '#7460a7', art: '/assets/worlds/letters.webp' },
  { gameId: 'numbers', name: 'מצפה הכוכבים', companion: 'לווייתן הכוכבים', keepsake: 'מצפן הכוכבים', story: 'לווייתן קטן שט בין כוכבים. עוזרים לו לספור את האורות ולמצוא את הדרך הביתה.', color: '#287789', art: '/assets/worlds/numbers.webp' },
  { gameId: 'shapes', name: 'טירת הצורות', companion: 'שועל הבנאים', keepsake: 'מפתח הטירה', story: 'השועל בונה טירה של חלומות. כל צורה שמכירים מוצאת בה מקום משלה.', color: '#ad633e', art: '/assets/worlds/shapes.webp' },
  { gameId: 'colors', name: 'גן הקשת', companion: 'זיקית הקשת', keepsake: 'מכחול הקשת', story: 'בגן של הזיקית כל פרח הוא צבע חדש. יחד צובעים את העולם בגוונים שמחים.', color: '#347b60', art: '/assets/worlds/colors.webp' },
  { gameId: 'matching', name: 'גן החברים', companion: 'הארנבים התאומים', keepsake: 'לב החברות', story: 'שני ארנבים מחפשים דברים שמתאימים זה לזה. כשמוצאים זוג, צומחת עוד חברות.', color: '#477961', art: '/assets/worlds/matching.webp' },
  { gameId: 'memory', name: 'אי החלומות', companion: 'פיל החלומות', keepsake: 'פנס החלומות', story: 'הפיל שומר זיכרונות קטנים באי של אור ירח. מגלים איתו זוגות של הפתעות.', color: '#6d609c', art: '/assets/worlds/memory.webp' },
  { gameId: 'patterns', name: 'רכבת המנגינות', companion: 'ציפור המנגינות', keepsake: 'שרביט המנגינות', story: 'הציפור מנצחת על רכבת צבעונית. לכל קרון יש מקום בקצב שחוזר שוב ושוב.', color: '#347c82', art: '/assets/worlds/patterns.webp' },
  { gameId: 'sorting', name: 'יער האוצרות', companion: 'סנאי האוצרות', keepsake: 'סל האוצרות', story: 'הסנאי אוסף אוצרות מהיער. עוזרים לו לגלות מה שייך לכל סל קטן.', color: '#92702f', art: '/assets/worlds/sorting.webp' },
];

export const collectionMilestones = [1, 3, 6] as const;

/** Use completed, persisted achievements. Hints and assisted play count equally.
 * Old adventure rewards survive alongside newer creations without double counting.
 * Session summaries overlap detective rounds, so they are a legacy fallback only.
 */
export function worldProgress(data: ProfileLearningData, scope: DiscoveryScope) {
  const discoveries = new Set(data.detectives?.discoveries.filter(d => d.scope === scope).map(d => d.id)).size;
  const adventure = scope === 'letters' || scope === 'numbers' || scope === 'shapes' || scope === 'colors'
    ? data.adventures?.[scope] : undefined;
  const creations = adventure?.creations ?? [];
  const creationMissions = new Set(creations.map(c => c.missionId));
  const oldRewards = new Set([...(adventure?.rewards ?? []), ...(adventure?.completed ?? [])]);
  const adventures = new Set(creations.map(c => c.id)).size + [...oldRewards].filter(id => !creationMissions.has(id)).length;
  const legacySessions = new Set(data.sessions.filter(s => s.gameId === scope && s.total > 0).map(s => s.id)).size;
  const savedMilestone = Math.max(0, ...collectionMilestones.filter(m => data.journey.decorationIds.includes(`keepsake:${scope}:${m}`)));
  const count = Math.max(discoveries + adventures, legacySessions, savedMilestone);
  const earned = collectionMilestones.filter(m => count >= m).length;
  const next = collectionMilestones.find(m => m > count);
  return { count, earned, next, remaining: next ? next - count : 0 };
}
