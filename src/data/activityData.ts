import { MatchingPair, MemoryCard, PatternPuzzle, SortingChallenge } from '../types';

export const matchingPairs: MatchingPair[] = [
  { id: 'm1', left: '🍌', right: 'בננה', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm2', left: '🔺', right: 'משולש', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm3', left: '🐶', right: 'כלב', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm4', left: '🍎', right: 'תפוח', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm5', left: '⭐', right: 'כוכב', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm6', left: '🚗', right: 'מכונית', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm7', left: '3', right: 'שלוש', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm8', left: '☀️', right: 'שמש', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm9', left: '🟦', right: 'ריבוע', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm10', left: '🐱', right: 'חתול', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm11', left: '🚲', right: 'אופניים', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm12', left: '🌸', right: 'פרח', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm13', left: '7', right: 'שבע', age: [5, 6], difficulty: 'hard' },
  { id: 'm14', left: '🚪', right: 'דלת', age: [5, 6], difficulty: 'hard' },
  { id: 'm15', left: '🪟', right: 'חלון', age: [5, 6], difficulty: 'hard' },
  { id: 'm16', left: '🥕', right: 'גזר', age: [5, 6], difficulty: 'hard' },
  { id: 'm17', left: '📘', right: 'ספר', age: [5, 6], difficulty: 'hard' },
  { id: 'm18', left: '10', right: 'עשר', age: [5, 6], difficulty: 'hard' }
];

const memoryValues = [
  { value: '🍎', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '🚗', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '🌙', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '🐶', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '🍌', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '🧸', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '⭐', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🐟', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🦋', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🚀', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🌈', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🎈', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🧁', age: [5, 6], difficulty: 'hard' },
  { value: '🪁', age: [5, 6], difficulty: 'hard' },
  { value: '🛼', age: [5, 6], difficulty: 'hard' },
  { value: '🧃', age: [5, 6], difficulty: 'hard' },
  { value: '🎻', age: [5, 6], difficulty: 'hard' },
  { value: '🧠', age: [5, 6], difficulty: 'hard' }
] as const;

export const memoryCards: MemoryCard[] = memoryValues.flatMap((item, index) => {
  const pairId = `pair-${index + 1}`;
  return [
    { id: `${pairId}-a`, pairId, value: item.value, age: [...item.age], difficulty: item.difficulty },
    { id: `${pairId}-b`, pairId, value: item.value, age: [...item.age], difficulty: item.difficulty }
  ];
});

export const patternPuzzles: PatternPuzzle[] = [
  { id: 'pattern-easy-1', age: [4, 5], difficulty: 'easy', prompt: 'מה בא אחרי הסדרה?', sequence: ['🔴', '🔵', '🔴', '🔵', '?'], options: [{ id: 'red', label: 'אדום', emoji: '🔴' }, { id: 'blue', label: 'כחול', emoji: '🔵' }, { id: 'yellow', label: 'צהוב', emoji: '🟡' }], correctOptionId: 'red' },
  { id: 'pattern-easy-2', age: [4, 5], difficulty: 'easy', prompt: 'השלימו את הרצף', sequence: ['⭐', '🌙', '⭐', '🌙', '?'], options: [{ id: 'moon', label: 'ירח', emoji: '🌙' }, { id: 'star', label: 'כוכב', emoji: '⭐' }, { id: 'sun', label: 'שמש', emoji: '☀️' }], correctOptionId: 'star' },
  { id: 'pattern-easy-3', age: [4, 5], difficulty: 'easy', prompt: 'מה הצורה הבאה?', sequence: ['🟢', '🟨', '🟢', '🟨', '?'], options: [{ id: 'circle', label: 'עיגול', emoji: '🟢' }, { id: 'square', label: 'ריבוע', emoji: '🟨' }, { id: 'triangle', label: 'משולש', emoji: '🔺' }], correctOptionId: 'circle' },
  { id: 'pattern-easy-4', age: [4, 5], difficulty: 'easy', prompt: 'מה המספר הבא?', sequence: ['1', '2', '1', '2', '?'], options: [{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }], correctOptionId: '1' },
  { id: 'pattern-medium-1', age: [5, 6], difficulty: 'medium', prompt: 'מה בא אחרי הסדרה?', sequence: ['🍎', '🍌', '🍇', '🍎', '🍌', '?'], options: [{ id: 'grapes', label: 'ענבים', emoji: '🍇' }, { id: 'apple', label: 'תפוח', emoji: '🍎' }, { id: 'banana', label: 'בננה', emoji: '🍌' }], correctOptionId: 'grapes' },
  { id: 'pattern-medium-2', age: [5, 6], difficulty: 'medium', prompt: 'השלימו את רצף המספרים', sequence: ['2', '4', '6', '?'], options: [{ id: '7', label: '7' }, { id: '8', label: '8' }, { id: '5', label: '5' }], correctOptionId: '8' },
  { id: 'pattern-medium-3', age: [5, 6], difficulty: 'medium', prompt: 'מה בא במקום סימן השאלה?', sequence: ['🔺', '🟦', '🟦', '🔺', '🟦', '🟦', '?'], options: [{ id: 'triangle', label: 'משולש', emoji: '🔺' }, { id: 'square', label: 'ריבוע', emoji: '🟦' }, { id: 'circle', label: 'עיגול', emoji: '🟢' }], correctOptionId: 'triangle' },
  { id: 'pattern-medium-4', age: [5, 6], difficulty: 'medium', prompt: 'מה האיבר הבא ברצף?', sequence: ['☀️', '☁️', '🌧️', '☀️', '☁️', '?'], options: [{ id: 'rain', label: 'גשם', emoji: '🌧️' }, { id: 'sun', label: 'שמש', emoji: '☀️' }, { id: 'cloud', label: 'ענן', emoji: '☁️' }], correctOptionId: 'rain' },
  { id: 'pattern-hard-1', age: [6], difficulty: 'hard', prompt: 'השלימו את הדילוגים', sequence: ['1', '3', '5', '?'], options: [{ id: '7', label: '7' }, { id: '6', label: '6' }, { id: '8', label: '8' }], correctOptionId: '7' },
  { id: 'pattern-hard-2', age: [6], difficulty: 'hard', prompt: 'מה בא אחרי שני פריטים חוזרים?', sequence: ['🐶', '🐶', '🐱', '🐶', '🐶', '?'], options: [{ id: 'cat', label: 'חתול', emoji: '🐱' }, { id: 'dog', label: 'כלב', emoji: '🐶' }, { id: 'fish', label: 'דג', emoji: '🐟' }], correctOptionId: 'cat' },
  { id: 'pattern-hard-3', age: [6], difficulty: 'hard', prompt: 'השלימו את הרצף היורד', sequence: ['9', '7', '5', '?'], options: [{ id: '3', label: '3' }, { id: '4', label: '4' }, { id: '6', label: '6' }], correctOptionId: '3' },
  { id: 'pattern-hard-4', age: [6], difficulty: 'hard', prompt: 'איזו צורה משלימה את התבנית?', sequence: ['🟢', '🔺', '🟦', '🟢', '🔺', '?'], options: [{ id: 'square', label: 'ריבוע', emoji: '🟦' }, { id: 'circle', label: 'עיגול', emoji: '🟢' }, { id: 'triangle', label: 'משולש', emoji: '🔺' }], correctOptionId: 'square' }
];

export const sortingChallenges: SortingChallenge[] = [
  { id: 'sort-easy-1', age: [3, 4], difficulty: 'easy', prompt: 'לאיזו קבוצה שייכת הבננה?', item: '🍌', itemName: 'בננה', options: [{ id: 'fruit', label: 'פירות', emoji: '🍎' }, { id: 'animals', label: 'חיות', emoji: '🐶' }, { id: 'vehicles', label: 'כלי תחבורה', emoji: '🚗' }], correctOptionId: 'fruit' },
  { id: 'sort-easy-2', age: [3, 4], difficulty: 'easy', prompt: 'לאיזו קבוצה שייך הכלב?', item: '🐶', itemName: 'כלב', options: [{ id: 'animals', label: 'חיות', emoji: '🐱' }, { id: 'colors', label: 'צבעים', emoji: '🎨' }, { id: 'food', label: 'אוכל', emoji: '🍽️' }], correctOptionId: 'animals' },
  { id: 'sort-easy-3', age: [3, 4], difficulty: 'easy', prompt: 'לאיזו קבוצה שייכת המכונית?', item: '🚗', itemName: 'מכונית', options: [{ id: 'vehicles', label: 'כלי תחבורה', emoji: '🚌' }, { id: 'fruit', label: 'פירות', emoji: '🍇' }, { id: 'shapes', label: 'צורות', emoji: '🔺' }], correctOptionId: 'vehicles' },
  { id: 'sort-easy-4', age: [3, 4], difficulty: 'easy', prompt: 'לאיזו קבוצה שייך הכדור?', item: '⚽', itemName: 'כדור', options: [{ id: 'toys', label: 'משחקים', emoji: '🧸' }, { id: 'animals', label: 'חיות', emoji: '🐟' }, { id: 'fruit', label: 'פירות', emoji: '🍌' }], correctOptionId: 'toys' },
  { id: 'sort-medium-1', age: [4, 5, 6], difficulty: 'medium', prompt: 'מה מתאים לקבוצת כלי נגינה?', item: '🎻', itemName: 'כינור', options: [{ id: 'music', label: 'כלי נגינה', emoji: '🎵' }, { id: 'clothes', label: 'בגדים', emoji: '👕' }, { id: 'animals', label: 'חיות', emoji: '🐱' }], correctOptionId: 'music' },
  { id: 'sort-medium-2', age: [4, 5, 6], difficulty: 'medium', prompt: 'לאיזו קבוצה שייכת החולצה?', item: '👕', itemName: 'חולצה', options: [{ id: 'clothes', label: 'בגדים', emoji: '🧦' }, { id: 'vehicles', label: 'כלי תחבורה', emoji: '🚲' }, { id: 'food', label: 'אוכל', emoji: '🥕' }], correctOptionId: 'clothes' },
  { id: 'sort-medium-3', age: [4, 5, 6], difficulty: 'medium', prompt: 'לאיזו קבוצה שייך הגזר?', item: '🥕', itemName: 'גזר', options: [{ id: 'vegetables', label: 'ירקות', emoji: '🥦' }, { id: 'toys', label: 'צעצועים', emoji: '🧸' }, { id: 'weather', label: 'מזג אוויר', emoji: '☀️' }], correctOptionId: 'vegetables' },
  { id: 'sort-medium-4', age: [4, 5, 6], difficulty: 'medium', prompt: 'לאיזו קבוצה שייך הענן?', item: '☁️', itemName: 'ענן', options: [{ id: 'weather', label: 'מזג אוויר', emoji: '🌧️' }, { id: 'letters', label: 'אותיות', emoji: '🔤' }, { id: 'fruit', label: 'פירות', emoji: '🍓' }], correctOptionId: 'weather' },
  { id: 'sort-hard-1', age: [5, 6], difficulty: 'hard', prompt: 'מה שייך לקבוצת דברים שצומחים?', item: '🌸', itemName: 'פרח', options: [{ id: 'plants', label: 'צמחים', emoji: '🌱' }, { id: 'vehicles', label: 'כלי תחבורה', emoji: '🚂' }, { id: 'music', label: 'כלי נגינה', emoji: '🎸' }], correctOptionId: 'plants' },
  { id: 'sort-hard-2', age: [5, 6], difficulty: 'hard', prompt: 'מה שייך לקבוצת דברים שאוכלים?', item: '🍞', itemName: 'לחם', options: [{ id: 'food', label: 'אוכל', emoji: '🍽️' }, { id: 'clothes', label: 'בגדים', emoji: '👟' }, { id: 'shapes', label: 'צורות', emoji: '🟦' }], correctOptionId: 'food' },
  { id: 'sort-hard-3', age: [5, 6], difficulty: 'hard', prompt: 'מה שייך לקבוצת כלי כתיבה?', item: '✏️', itemName: 'עיפרון', options: [{ id: 'writing', label: 'כלי כתיבה', emoji: '📒' }, { id: 'animals', label: 'חיות', emoji: '🦋' }, { id: 'weather', label: 'מזג אוויר', emoji: '⛅' }], correctOptionId: 'writing' },
  { id: 'sort-hard-4', age: [5, 6], difficulty: 'hard', prompt: 'מה שייך לקבוצת דברים שיש בבית?', item: '🪑', itemName: 'כיסא', options: [{ id: 'home', label: 'רהיטים לבית', emoji: '🏠' }, { id: 'vehicles', label: 'כלי תחבורה', emoji: '🚗' }, { id: 'fruit', label: 'פירות', emoji: '🍎' }], correctOptionId: 'home' }
];
