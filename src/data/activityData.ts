import { Difficulty, MatchingPair, MemoryCard, PatternPuzzle, QuizOption, SortingChallenge } from '../types';

const allAges = [3, 4, 5, 6] as const;

type PairSeed = Omit<MatchingPair, 'id' | 'age'> & { age?: MatchingPair['age'] };
type PatternSeed = Omit<PatternPuzzle, 'id' | 'age'> & { age?: PatternPuzzle['age'] };
type SortingSeed = Omit<SortingChallenge, 'id' | 'age'> & { age?: SortingChallenge['age'] };

function quizOption(id: string, label: string, emoji?: string): QuizOption {
  return emoji ? { id, label, emoji } : { id, label };
}

function withAges<T extends { age?: number[] }>(item: T): T & { age: MatchingPair['age'] } {
  return { ...item, age: [...(item.age ?? allAges)] as MatchingPair['age'] };
}

const matchingSeeds: PairSeed[] = [
  { left: '🍌', right: 'בננה', difficulty: 'easy' },
  { left: '🍎', right: 'תפוח', difficulty: 'easy' },
  { left: '🐶', right: 'כלב', difficulty: 'easy' },
  { left: '🐱', right: 'חתול', difficulty: 'easy' },
  { left: '🏠', right: 'בית', difficulty: 'easy' },
  { left: '☀️', right: 'שמש', difficulty: 'easy' },
  { left: '🌙', right: 'ירח', difficulty: 'easy' },
  { left: '🌸', right: 'פרח', difficulty: 'easy' },
  { left: '📘', right: 'ספר', difficulty: 'easy' },
  { left: '✏️', right: 'עיפרון', difficulty: 'easy' },
  { left: '⚽', right: 'כדור', difficulty: 'easy' },
  { left: '🎈', right: 'בלון', difficulty: 'easy' },
  { left: '🥕', right: 'גזר', difficulty: 'easy' },
  { left: '🚗', right: 'מכונית', difficulty: 'easy' },
  { left: '🥤', right: 'כוס', difficulty: 'easy' },
  { left: '🍞', right: 'לחם', difficulty: 'easy' },
  { left: '1', right: 'אחת', difficulty: 'medium' },
  { left: '2', right: 'שתיים', difficulty: 'medium' },
  { left: '3', right: 'שלוש', difficulty: 'medium' },
  { left: '4', right: 'ארבע', difficulty: 'medium' },
  { left: '5', right: 'חמש', difficulty: 'medium' },
  { left: '6', right: 'שש', difficulty: 'medium' },
  { left: '7', right: 'שבע', difficulty: 'medium' },
  { left: '8', right: 'שמונה', difficulty: 'medium' },
  { left: '🔵', right: 'עיגול', difficulty: 'medium' },
  { left: '🟦', right: 'ריבוע', difficulty: 'medium' },
  { left: '🔺', right: 'משולש', difficulty: 'medium' },
  { left: '▭', right: 'מלבן', difficulty: 'medium' },
  { left: '⭐', right: 'כוכב', difficulty: 'medium' },
  { left: '🟢', right: 'ירוק', difficulty: 'medium' },
  { left: '🔴', right: 'אדום', difficulty: 'medium' },
  { left: '🟡', right: 'צהוב', difficulty: 'medium' },
  { left: 'א', right: 'אבא', difficulty: 'hard' },
  { left: 'ב', right: 'בית', difficulty: 'hard' },
  { left: 'ד', right: 'דג', difficulty: 'hard' },
  { left: 'כ', right: 'כדור', difficulty: 'hard' },
  { left: 'ש', right: 'שמש', difficulty: 'hard' },
  { left: 'ס', right: 'ספר', difficulty: 'hard' },
  { left: 'פ', right: 'פרח', difficulty: 'hard' },
  { left: 'ג', right: 'גזר', difficulty: 'hard' },
  { left: 'נ', right: 'נעל', difficulty: 'hard' },
  { left: 'ר', right: 'רכבת', difficulty: 'hard' },
  { left: 'ח', right: 'חתול', difficulty: 'hard' },
  { left: 'ע', right: 'עיפרון', difficulty: 'hard' },
  { left: 'ם', right: 'אות סופית במילה ים', difficulty: 'hard' },
  { left: 'ך', right: 'אות סופית במילה מלך', difficulty: 'hard' },
  { left: 'ן', right: 'אות סופית במילה בלון', difficulty: 'hard' }
];

export const matchingPairs: MatchingPair[] = matchingSeeds.map((seed, index) => ({
  id: `match-${seed.difficulty}-${String(index + 1).padStart(3, '0')}`,
  ...withAges(seed)
}));

const memoryValuesByDifficulty: Record<Difficulty, string[]> = {
  easy: ['🍎', '🚗', '🌙', '🐶', '🍌', '🧸', '⭐', '⚽', '🏠', '🌸', '📘', '🎈', '🥕', '☀️', '🐟', '🥤'],
  medium: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', '1', '2', '3', '4', '5', '6', '🔵', '🟦', '🔺', '🟢'],
  hard: ['ים', 'מלך', 'בית', 'שמש', 'ספר', 'פרח', 'גזר', 'כדור', 'חתול', 'רכבת', '7', '8', '9', '10', '▭', '⭐', '🟣', '🟠']
};

const memorySeeds = Object.entries(memoryValuesByDifficulty).flatMap(([difficulty, values]) =>
  values.map((value) => ({ value, difficulty: difficulty as Difficulty }))
);

export const memoryCards: MemoryCard[] = memorySeeds.flatMap((item, index) => {
  const pairId = `memory-${item.difficulty}-${String(index + 1).padStart(3, '0')}`;
  const baseCard = { pairId, value: item.value, age: [...allAges] as MemoryCard['age'], difficulty: item.difficulty };
  return [
    { id: `${pairId}-a`, ...baseCard },
    { id: `${pairId}-b`, ...baseCard }
  ];
});

const patternSeeds: PatternSeed[] = [
  { difficulty: 'easy', prompt: 'מה בא אחרי הסדר?', sequence: ['🔴', '🔵', '🔴', '🔵', '?'], options: [quizOption('red', 'אדום', '🔴'), quizOption('blue', 'כחול', '🔵'), quizOption('yellow', 'צהוב', '🟡')], correctOptionId: 'red' },
  { difficulty: 'easy', prompt: 'השלימו את הרצף', sequence: ['⭐', '🌙', '⭐', '🌙', '?'], options: [quizOption('moon', 'ירח', '🌙'), quizOption('star', 'כוכב', '⭐'), quizOption('sun', 'שמש', '☀️')], correctOptionId: 'star' },
  { difficulty: 'easy', prompt: 'מה הצורה הבאה?', sequence: ['🟢', '🟨', '🟢', '🟨', '?'], options: [quizOption('circle', 'עיגול', '🟢'), quizOption('square', 'ריבוע', '🟨'), quizOption('triangle', 'משולש', '🔺')], correctOptionId: 'circle' },
  { difficulty: 'easy', prompt: 'מה המספר הבא?', sequence: ['1', '2', '1', '2', '?'], options: [quizOption('1', '1'), quizOption('2', '2'), quizOption('3', '3')], correctOptionId: '1' },
  { difficulty: 'easy', prompt: 'מה בא עכשיו?', sequence: ['🍎', '🍌', '🍎', '🍌', '?'], options: [quizOption('apple', 'תפוח', '🍎'), quizOption('banana', 'בננה', '🍌'), quizOption('grape', 'ענבים', '🍇')], correctOptionId: 'apple' },
  { difficulty: 'easy', prompt: 'השלימו את התבנית', sequence: ['🐶', '🐱', '🐶', '🐱', '?'], options: [quizOption('dog', 'כלב', '🐶'), quizOption('cat', 'חתול', '🐱'), quizOption('fish', 'דג', '🐟')], correctOptionId: 'dog' },
  { difficulty: 'easy', prompt: 'מה חסר בסוף?', sequence: ['🟦', '🔺', '🟦', '🔺', '?'], options: [quizOption('square', 'ריבוע', '🟦'), quizOption('triangle', 'משולש', '🔺'), quizOption('circle', 'עיגול', '🔵')], correctOptionId: 'square' },
  { difficulty: 'easy', prompt: 'מה בא אחרי?', sequence: ['☀️', '☁️', '☀️', '☁️', '?'], options: [quizOption('sun', 'שמש', '☀️'), quizOption('cloud', 'ענן', '☁️'), quizOption('rain', 'גשם', '🌧️')], correctOptionId: 'sun' },
  { difficulty: 'medium', prompt: 'מה בא אחרי הסדר?', sequence: ['🍎', '🍌', '🍇', '🍎', '🍌', '?'], options: [quizOption('grapes', 'ענבים', '🍇'), quizOption('apple', 'תפוח', '🍎'), quizOption('banana', 'בננה', '🍌')], correctOptionId: 'grapes' },
  { difficulty: 'medium', prompt: 'השלימו את רצף המספרים', sequence: ['2', '4', '6', '?'], options: [quizOption('7', '7'), quizOption('8', '8'), quizOption('5', '5')], correctOptionId: '8' },
  { difficulty: 'medium', prompt: 'מה בא במקום סימן השאלה?', sequence: ['🔺', '🟦', '🟦', '🔺', '🟦', '🟦', '?'], options: [quizOption('triangle', 'משולש', '🔺'), quizOption('square', 'ריבוע', '🟦'), quizOption('circle', 'עיגול', '🔵')], correctOptionId: 'triangle' },
  { difficulty: 'medium', prompt: 'מה האיבר הבא ברצף?', sequence: ['☀️', '☁️', '🌧️', '☀️', '☁️', '?'], options: [quizOption('rain', 'גשם', '🌧️'), quizOption('sun', 'שמש', '☀️'), quizOption('cloud', 'ענן', '☁️')], correctOptionId: 'rain' },
  { difficulty: 'medium', prompt: 'מה המספר הבא?', sequence: ['1', '3', '5', '?'], options: [quizOption('7', '7'), quizOption('6', '6'), quizOption('8', '8')], correctOptionId: '7' },
  { difficulty: 'medium', prompt: 'מה בא אחרי שני פריטים חוזרים?', sequence: ['🐶', '🐶', '🐱', '🐶', '🐶', '?'], options: [quizOption('cat', 'חתול', '🐱'), quizOption('dog', 'כלב', '🐶'), quizOption('fish', 'דג', '🐟')], correctOptionId: 'cat' },
  { difficulty: 'medium', prompt: 'השלימו את הרצף היורד', sequence: ['6', '5', '4', '?'], options: [quizOption('3', '3'), quizOption('5', '5'), quizOption('7', '7')], correctOptionId: '3' },
  { difficulty: 'medium', prompt: 'איזו צורה משלימה?', sequence: ['🔵', '🔺', '🟦', '🔵', '🔺', '?'], options: [quizOption('square', 'ריבוע', '🟦'), quizOption('circle', 'עיגול', '🔵'), quizOption('triangle', 'משולש', '🔺')], correctOptionId: 'square' },
  { difficulty: 'hard', prompt: 'השלימו את הדילוגים', sequence: ['1', '3', '5', '7', '?'], options: [quizOption('9', '9'), quizOption('8', '8'), quizOption('10', '10')], correctOptionId: '9' },
  { difficulty: 'hard', prompt: 'השלימו את הרצף היורד', sequence: ['9', '7', '5', '?'], options: [quizOption('3', '3'), quizOption('4', '4'), quizOption('6', '6')], correctOptionId: '3' },
  { difficulty: 'hard', prompt: 'מה הפריט הבא?', sequence: ['🍎', '🍎', '🍌', '🍇', '🍎', '🍎', '🍌', '?'], options: [quizOption('grapes', 'ענבים', '🍇'), quizOption('apple', 'תפוח', '🍎'), quizOption('banana', 'בננה', '🍌')], correctOptionId: 'grapes' },
  { difficulty: 'hard', prompt: 'מה הצורה החסרה?', sequence: ['🔺', '🟦', '🔵', '🔺', '🟦', '?'], options: [quizOption('circle', 'עיגול', '🔵'), quizOption('square', 'ריבוע', '🟦'), quizOption('triangle', 'משולש', '🔺')], correctOptionId: 'circle' },
  { difficulty: 'hard', prompt: 'מה בא אחרי זוג וצבע?', sequence: ['🔴', '🔴', '🔵', '🔴', '🔴', '?'], options: [quizOption('blue', 'כחול', '🔵'), quizOption('red', 'אדום', '🔴'), quizOption('yellow', 'צהוב', '🟡')], correctOptionId: 'blue' },
  { difficulty: 'hard', prompt: 'השלימו את סדר האותיות', sequence: ['א', 'ב', 'ג', '?'], options: [quizOption('d', 'ד'), quizOption('h', 'ה'), quizOption('a', 'א')], correctOptionId: 'd' },
  { difficulty: 'hard', prompt: 'מה המספר החסר?', sequence: ['2', '5', '8', '?'], options: [quizOption('11', '11'), quizOption('10', '10'), quizOption('9', '9')], correctOptionId: '11' },
  { difficulty: 'hard', prompt: 'מה בא בתבנית?', sequence: ['☀️', '☀️', '☁️', '🌧️', '☀️', '☀️', '☁️', '?'], options: [quizOption('rain', 'גשם', '🌧️'), quizOption('sun', 'שמש', '☀️'), quizOption('cloud', 'ענן', '☁️')], correctOptionId: 'rain' }
];

export const patternPuzzles: PatternPuzzle[] = patternSeeds.map((seed, index) => ({
  id: `pattern-${seed.difficulty}-${String(index + 1).padStart(3, '0')}`,
  ...withAges(seed),
  audioText: seed.audioText ?? seed.prompt
}));

const sortingSeeds: SortingSeed[] = [
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייכת הבננה?', item: '🍌', itemName: 'בננה', options: [quizOption('fruit', 'פירות', '🍎'), quizOption('animals', 'חיות', '🐶'), quizOption('vehicles', 'כלי תחבורה', '🚗')], correctOptionId: 'fruit' },
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייך הכלב?', item: '🐶', itemName: 'כלב', options: [quizOption('animals', 'חיות', '🐱'), quizOption('colors', 'צבעים', '🎨'), quizOption('food', 'אוכל', '🍽️')], correctOptionId: 'animals' },
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייכת המכונית?', item: '🚗', itemName: 'מכונית', options: [quizOption('vehicles', 'כלי תחבורה', '🚌'), quizOption('fruit', 'פירות', '🍇'), quizOption('shapes', 'צורות', '🔺')], correctOptionId: 'vehicles' },
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייך הכדור?', item: '⚽', itemName: 'כדור', options: [quizOption('toys', 'משחקים', '🧸'), quizOption('animals', 'חיות', '🐟'), quizOption('fruit', 'פירות', '🍌')], correctOptionId: 'toys' },
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייך התפוח?', item: '🍎', itemName: 'תפוח', options: [quizOption('fruit', 'פירות', '🍓'), quizOption('vehicles', 'כלי תחבורה', '🚲'), quizOption('clothes', 'בגדים', '👕')], correctOptionId: 'fruit' },
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייכת החולצה?', item: '👕', itemName: 'חולצה', options: [quizOption('clothes', 'בגדים', '🧦'), quizOption('food', 'אוכל', '🥕'), quizOption('weather', 'מזג אוויר', '☀️')], correctOptionId: 'clothes' },
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייך הענן?', item: '☁️', itemName: 'ענן', options: [quizOption('weather', 'מזג אוויר', '🌧️'), quizOption('letters', 'אותיות', '🔤'), quizOption('fruit', 'פירות', '🍓')], correctOptionId: 'weather' },
  { difficulty: 'easy', prompt: 'לאיזו קבוצה שייך הספר?', item: '📘', itemName: 'ספר', options: [quizOption('school', 'דברי למידה', '✏️'), quizOption('animals', 'חיות', '🐶'), quizOption('vehicles', 'כלי תחבורה', '🚗')], correctOptionId: 'school' },
  { difficulty: 'medium', prompt: 'מה מתאים לקבוצת כלי נגינה?', item: '🎻', itemName: 'כינור', options: [quizOption('music', 'כלי נגינה', '🎵'), quizOption('clothes', 'בגדים', '👕'), quizOption('animals', 'חיות', '🐱')], correctOptionId: 'music' },
  { difficulty: 'medium', prompt: 'לאיזו קבוצה שייך הגזר?', item: '🥕', itemName: 'גזר', options: [quizOption('vegetables', 'ירקות', '🥦'), quizOption('toys', 'צעצועים', '🧸'), quizOption('weather', 'מזג אוויר', '☀️')], correctOptionId: 'vegetables' },
  { difficulty: 'medium', prompt: 'לאיזו קבוצה שייך העיפרון?', item: '✏️', itemName: 'עיפרון', options: [quizOption('writing', 'כלי כתיבה', '📒'), quizOption('animals', 'חיות', '🦋'), quizOption('weather', 'מזג אוויר', '⛅')], correctOptionId: 'writing' },
  { difficulty: 'medium', prompt: 'מה שייך לקבוצת דברים שצומחים?', item: '🌸', itemName: 'פרח', options: [quizOption('plants', 'צמחים', '🌱'), quizOption('vehicles', 'כלי תחבורה', '🚂'), quizOption('music', 'כלי נגינה', '🎸')], correctOptionId: 'plants' },
  { difficulty: 'medium', prompt: 'מה שייך לקבוצת דברים שאוכלים?', item: '🍞', itemName: 'לחם', options: [quizOption('food', 'אוכל', '🍽️'), quizOption('clothes', 'בגדים', '👟'), quizOption('shapes', 'צורות', '🟦')], correctOptionId: 'food' },
  { difficulty: 'medium', prompt: 'לאיזו קבוצה שייך האוטובוס?', item: '🚌', itemName: 'אוטובוס', options: [quizOption('vehicles', 'כלי תחבורה', '🚗'), quizOption('fruit', 'פירות', '🍌'), quizOption('colors', 'צבעים', '🔴')], correctOptionId: 'vehicles' },
  { difficulty: 'medium', prompt: 'לאיזו קבוצה שייך הדג?', item: '🐟', itemName: 'דג', options: [quizOption('animals', 'חיות', '🐶'), quizOption('plants', 'צמחים', '🌱'), quizOption('school', 'דברי למידה', '📘')], correctOptionId: 'animals' },
  { difficulty: 'medium', prompt: 'לאיזו קבוצה שייך הכיסא?', item: '🪑', itemName: 'כיסא', options: [quizOption('home', 'רהיטים לבית', '🏠'), quizOption('vehicles', 'כלי תחבורה', '🚗'), quizOption('fruit', 'פירות', '🍎')], correctOptionId: 'home' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת צורות עם פינות?', item: '🟦', itemName: 'ריבוע', options: [quizOption('corner-shapes', 'צורות עם פינות', '🔺'), quizOption('round-shapes', 'צורות עגולות', '🔵'), quizOption('colors', 'צבעים', '🎨')], correctOptionId: 'corner-shapes' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת צבעים חמים?', item: '🔴', itemName: 'אדום', options: [quizOption('warm-colors', 'צבעים חמים', '🟠'), quizOption('cold-colors', 'צבעים קרים', '🔵'), quizOption('animals', 'חיות', '🐱')], correctOptionId: 'warm-colors' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת מספרים זוגיים?', item: '6', itemName: 'שש', options: [quizOption('even', 'מספרים זוגיים', '2'), quizOption('odd', 'מספרים אי-זוגיים', '3'), quizOption('letters', 'אותיות', 'א')], correctOptionId: 'even' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת אותיות סופיות?', item: 'ם', itemName: 'מם סופית', options: [quizOption('final-letters', 'אותיות סופיות', 'ך'), quizOption('numbers', 'מספרים', '5'), quizOption('colors', 'צבעים', '🔵')], correctOptionId: 'final-letters' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת כלי כתיבה?', item: '📒', itemName: 'מחברת', options: [quizOption('writing', 'כלי כתיבה', '✏️'), quizOption('weather', 'מזג אוויר', '☁️'), quizOption('fruit', 'פירות', '🍇')], correctOptionId: 'writing' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת כלי מטבח?', item: '🥤', itemName: 'כוס', options: [quizOption('kitchen', 'כלי מטבח', '🍽️'), quizOption('vehicles', 'כלי תחבורה', '🚲'), quizOption('plants', 'צמחים', '🌸')], correctOptionId: 'kitchen' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת מאכלים מתוקים?', item: '🍫', itemName: 'שוקולד', options: [quizOption('sweet-food', 'מאכלים מתוקים', '🍓'), quizOption('clothes', 'בגדים', '👕'), quizOption('shapes', 'צורות', '⭐')], correctOptionId: 'sweet-food' },
  { difficulty: 'hard', prompt: 'מה שייך לקבוצת דברים בשמים?', item: '🌙', itemName: 'ירח', options: [quizOption('sky', 'דברים בשמים', '☀️'), quizOption('home', 'רהיטים לבית', '🪑'), quizOption('vegetables', 'ירקות', '🥕')], correctOptionId: 'sky' }
];

export const sortingChallenges: SortingChallenge[] = sortingSeeds.map((seed, index) => ({
  id: `sort-${seed.difficulty}-${String(index + 1).padStart(3, '0')}`,
  ...withAges(seed),
  audioText: seed.audioText ?? seed.prompt
}));
