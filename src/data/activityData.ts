import { MatchingPair, MemoryCard } from '../types';

export const matchingPairs: MatchingPair[] = [
  { id: 'm1', left: '🍌', right: 'בננה', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm2', left: '🔺', right: 'משולש', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm3', left: '3', right: 'שלוש', age: [3, 4, 5, 6], difficulty: 'medium' },
  { id: 'm4', left: '🐶', right: 'כלב', age: [3, 4, 5, 6], difficulty: 'easy' },
  { id: 'm5', left: '☀️', right: 'שמש', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm6', left: '🟦', right: 'ריבוע', age: [4, 5, 6], difficulty: 'medium' },
  { id: 'm7', left: '7', right: 'שבע', age: [5, 6], difficulty: 'hard' },
  { id: 'm8', left: '🚪', right: 'דלת', age: [5, 6], difficulty: 'hard' }
];

const memoryValues = [
  { value: '🍎', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '🚗', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '🌙', age: [3, 4, 5, 6], difficulty: 'easy' },
  { value: '⭐', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🧸', age: [4, 5, 6], difficulty: 'medium' },
  { value: '🐟', age: [5, 6], difficulty: 'hard' },
  { value: '🦋', age: [5, 6], difficulty: 'hard' },
  { value: '🚀', age: [5, 6], difficulty: 'hard' }
] as const;

export const memoryCards: MemoryCard[] = memoryValues.flatMap((item, index) => {
  const pairId = `pair-${index + 1}`;
  return [
    { id: `${pairId}-a`, pairId, value: item.value, age: [...item.age], difficulty: item.difficulty },
    { id: `${pairId}-b`, pairId, value: item.value, age: [...item.age], difficulty: item.difficulty }
  ];
});
