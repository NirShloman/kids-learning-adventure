import { GameDefinition } from '../types';

export const gameDefinitions: GameDefinition[] = [
  {
    id: 'letters',
    title: 'אותיות',
    emoji: '🔤',
    description: 'זיהוי אותיות, צלילים ומילים ראשונות בעברית.',
    accent: 'purple',
    recommendedAges: [3, 4, 5, 6]
  },
  {
    id: 'numbers',
    title: 'מספרים',
    emoji: '🔢',
    description: 'ספירה, התאמת כמות למספר וזיהוי ספרות.',
    accent: 'blue',
    recommendedAges: [3, 4, 5, 6]
  },
  {
    id: 'shapes',
    title: 'צורות',
    emoji: '🟠',
    description: 'מזהים עיגול, ריבוע, משולש, כוכב ועוד.',
    accent: 'orange',
    recommendedAges: [3, 4, 5, 6]
  },
  {
    id: 'colors',
    title: 'צבעים',
    emoji: '🎨',
    description: 'לומדים צבעים בסיסיים דרך תמונות ובחירה מהירה.',
    accent: 'pink',
    recommendedAges: [3, 4, 5, 6]
  },
  {
    id: 'matching',
    title: 'התאמה',
    emoji: '🧩',
    description: 'מחברים בין ציור, מילה, צורה או מספר.',
    accent: 'green',
    recommendedAges: [3, 4, 5, 6]
  },
  {
    id: 'memory',
    title: 'זיכרון',
    emoji: '🃏',
    description: 'מוצאים זוגות תואמים ומאמנים זיכרון חזותי.',
    accent: 'yellow',
    recommendedAges: [3, 4, 5, 6]
  }
];
