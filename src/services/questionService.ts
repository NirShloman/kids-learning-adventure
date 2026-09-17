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
import { getActiveProfile, getDetectiveProgress } from './learningStoreService';
import { canResume } from '../components/games/detective/detectiveEngine';
import type { DetectiveItem } from '../types/detective.types';

const quizGameIds: QuizQuestion['category'][] = ['letters', 'numbers', 'shapes', 'colors'];

function exactItems<T extends ContentItemBase>(items: T[], age: Age, difficulty: Difficulty): T[] {
  return items.filter((item) => item.ages.includes(age) && item.difficulty === difficulty);
}

function contentSignature(item: ContentItemBase): string {
  return item.taskFamily && item.conceptKey && item.variantKey
    ? `${item.taskFamily}:${item.conceptKey}:${item.variantKey}`
    : item.id;
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
  const recentSignatures = new Set(getRecentContent(recentKey));
  const freshItems = eligible.filter((item) => !recentSignatures.has(contentSignature(item)));
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

  saveRecentContent(recentKey, selected.map(contentSignature));
  return selected;
}

export async function getQuizQuestions(gameId: GameId, age: Age, difficulty: Difficulty): Promise<QuizQuestion[]> {
  if (!quizGameIds.includes(gameId as QuizQuestion['category'])) return [];
  const bank = await loadGameContent<QuizQuestion>(gameId);
  const profile = getActiveProfile();
  const saved = profile ? getDetectiveProgress(profile.id).rounds[gameId] : undefined;
  if (canResume(saved, bank.contentVersion, age, difficulty, bank.items as DetectiveItem[])) {
    return saved.steps.flatMap(step => step.ids.map(id => bank.items.find(item => item.id === id)!));
  }
  return selectBalancedItems(gameId, bank.items, age, difficulty, age <= 3 ? 8 : 10);
}

export async function getMatchingPairs(age: Age, difficulty: Difficulty): Promise<MatchingPair[]> {
  return getDetectivePairs<MatchingPair>('matching', age, difficulty, pairCount(age, difficulty));
}

export async function getMemoryCards(age: Age, difficulty: Difficulty): Promise<MemoryCard[]> {
  const pairs = await getDetectivePairs<MemoryPair>('memory', age, difficulty, pairCount(age, difficulty));
  const cards = pairs.flatMap((pair): MemoryCard[] => [
    { ...pair, id: `${pair.id}-a`, pairId: pair.id, value: pair.leftValue, visualToken: pair.leftVisual, imageAssetId: pair.leftImageAssetId },
    { ...pair, id: `${pair.id}-b`, pairId: pair.id, value: pair.rightValue, visualToken: pair.rightVisual, imageAssetId: pair.rightImageAssetId }
  ]);
  return shuffleArray(cards);
}

export function pairCount(age: Age, difficulty: Difficulty): number {
  const byAge: Record<Age, Record<Difficulty, number>> = {
    3: { easy: 2, medium: 3, hard: 4 },
    4: { easy: 3, medium: 4, hard: 5 },
    5: { easy: 4, medium: 5, hard: 6 },
    6: { easy: 5, medium: 6, hard: 7 }
  };
  return byAge[age][difficulty];
}

/** Homogeneous boards have one relation and no visually interchangeable pairs. */
export async function getDetectivePairs<T extends MatchingPair | MemoryPair>(gameId: 'matching' | 'memory', age: Age, difficulty: Difficulty, count: number, requiredId?: string, excludeIds: string[] = []): Promise<T[]> {
  const bank = await loadGameContent<T>(gameId);
  const eligible = exactItems(bank.items, age, difficulty).filter(item=>!excludeIds.includes(item.id));
  const key = `${gameId}:${age}:${difficulty}`, recent = new Set(getRecentContent(key));
  const required = eligible.find(item=>item.id===requiredId);
  const families = required ? [required.taskFamily] : shuffleArray([...new Set(eligible.map(item=>item.taskFamily))]);
  const candidates: T[][] = [];
  for (const family of families) {
    const seen = new Set<string>(), selected: T[] = [];
    const source = shuffleArray(eligible.filter(item=>item.taskFamily===family)).sort((a,b)=>Number(recent.has(contentSignature(a)))-Number(recent.has(contentSignature(b))));
    if(required)source.unshift(required);
    for(const item of source) {
      const left = 'left' in item ? item.left : item.leftValue, right = 'right' in item ? item.right : item.rightValue;
      if(seen.has(left)||seen.has(right))continue;
      selected.push(item); seen.add(left);seen.add(right);
      if(selected.length===count)break;
    }
    if(selected.length===count)candidates.push(selected);
  }
  const result = candidates.sort((a,b)=>a.filter(item=>recent.has(contentSignature(item))).length-b.filter(item=>recent.has(contentSignature(item))).length)[0] ?? [];
  if(result.length)saveRecentContent(key,result.map(contentSignature));
  return result;
}

export async function getPatternPuzzles(age: Age, difficulty: Difficulty): Promise<PatternPuzzle[]> {
  const bank = await loadGameContent<PatternPuzzle>('patterns');
  return selectBalancedItems('patterns', bank.items, age, difficulty, age <= 4 ? 5 : 7);
}

export async function getSortingChallenges(age: Age, difficulty: Difficulty): Promise<SortingChallenge[]> {
  const bank = await loadGameContent<SortingChallenge>('sorting');
  return selectBalancedItems('sorting', bank.items, age, difficulty, age <= 3 ? 5 : 7);
}
