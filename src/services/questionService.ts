import {
  Age,
  ContentItemBase,
  Difficulty,
  GameId,
  MatchingPair,
  MemoryCard,
  MemoryPair,
  PatternPuzzle,
  QuizQuestion,
  SortingChallenge
} from '../types';
import { shuffleArray } from '../utils/helpers';
import { getRecentContent, saveRecentContent } from './learnerProgressService';
import { loadGameContent } from './staticContentRepository';

const quizGameIds: QuizQuestion['category'][] = ['letters', 'numbers', 'shapes', 'colors'];

function exactItems<T extends ContentItemBase>(items: T[], age: Age, difficulty: Difficulty): T[] {
  return items.filter((item) => item.ages.includes(age) && item.difficulty === difficulty);
}

function selectBalancedItems<T extends ContentItemBase>(
  gameId: GameId,
  items: T[],
  age: Age,
  difficulty: Difficulty,
  count: number
): T[] {
  const eligible = exactItems(items, age, difficulty);
  if (!eligible.length) return [];

  const recentKey = `${gameId}:${age}:${difficulty}`;
  const recentIds = new Set(getRecentContent(recentKey));
  const freshItems = eligible.filter((item) => !recentIds.has(item.id));
  const source = freshItems.length >= count ? freshItems : eligible;
  const bySkill = new Map<string, T[]>();

  shuffleArray(source).forEach((item) => {
    const skillItems = bySkill.get(item.skill) ?? [];
    skillItems.push(item);
    bySkill.set(item.skill, skillItems);
  });

  const selected: T[] = [];
  const skillQueues = shuffleArray([...bySkill.values()]);
  while (selected.length < count && skillQueues.some((queue) => queue.length)) {
    skillQueues.forEach((queue) => {
      if (selected.length >= count) return;
      const item = queue.shift();
      if (item) selected.push(item);
    });
  }

  saveRecentContent(recentKey, selected.map((item) => item.id));
  return selected;
}

function uniqueMatchingPairs(items: MatchingPair[]): MatchingPair[] {
  const leftValues = new Set<string>();
  const rightValues = new Set<string>();
  return items.filter((item) => {
    if (leftValues.has(item.left) || rightValues.has(item.right)) return false;
    leftValues.add(item.left);
    rightValues.add(item.right);
    return true;
  });
}

export async function getQuizQuestions(gameId: GameId, age: Age, difficulty: Difficulty): Promise<QuizQuestion[]> {
  if (!quizGameIds.includes(gameId as QuizQuestion['category'])) return [];
  const bank = await loadGameContent<QuizQuestion>(gameId);
  return selectBalancedItems(gameId, bank.items, age, difficulty, age <= 3 ? 8 : 10);
}

export async function getMatchingPairs(age: Age, difficulty: Difficulty): Promise<MatchingPair[]> {
  const bank = await loadGameContent<MatchingPair>('matching');
  const maxPairs = age <= 3 ? 4 : age <= 4 ? 5 : 6;
  const selected = selectBalancedItems('matching', bank.items, age, difficulty, maxPairs * 2);
  return uniqueMatchingPairs(selected).slice(0, maxPairs);
}

export async function getMemoryCards(age: Age, difficulty: Difficulty): Promise<MemoryCard[]> {
  const bank = await loadGameContent<MemoryPair>('memory');
  const maxPairs = age <= 3 ? 4 : age <= 4 ? 5 : 6;
  const pairs = selectBalancedItems('memory', bank.items, age, difficulty, maxPairs);
  const cards = pairs.flatMap((pair): MemoryCard[] => [
    { ...pair, id: `${pair.id}-a`, pairId: pair.id },
    { ...pair, id: `${pair.id}-b`, pairId: pair.id }
  ]);
  return shuffleArray(cards);
}

export async function getPatternPuzzles(age: Age, difficulty: Difficulty): Promise<PatternPuzzle[]> {
  const bank = await loadGameContent<PatternPuzzle>('patterns');
  return selectBalancedItems('patterns', bank.items, age, difficulty, age <= 4 ? 5 : 7);
}

export async function getSortingChallenges(age: Age, difficulty: Difficulty): Promise<SortingChallenge[]> {
  const bank = await loadGameContent<SortingChallenge>('sorting');
  return selectBalancedItems('sorting', bank.items, age, difficulty, age <= 3 ? 5 : 7);
}
