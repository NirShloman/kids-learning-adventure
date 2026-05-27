import { allQuizQuestions } from '../data/questions';
import { matchingPairs, memoryCards, patternPuzzles, sortingChallenges } from '../data/activityData';
import { Age, Difficulty, GameId, MatchingPair, MemoryCard, PatternPuzzle, QuizQuestion, SortingChallenge } from '../types';
import { shuffleArray } from '../utils/helpers';
import { getApprovedQuizQuestions } from './speechTherapistAgent';

const quizGameIds: QuizQuestion['category'][] = ['letters', 'numbers', 'shapes', 'colors'];

function byAgeAndDifficulty<T extends { age: Age[]; difficulty: Difficulty }>(items: T[], age: Age, difficulty: Difficulty): T[] {
  const exact = items.filter((item) => item.age.includes(age) && item.difficulty === difficulty);
  const fallback = items.filter((item) => item.age.includes(age));
  return exact.length > 0 ? exact : fallback;
}

export function getQuizQuestions(gameId: GameId, age: Age, difficulty: Difficulty): QuizQuestion[] {
  if (!quizGameIds.includes(gameId as QuizQuestion['category'])) return [];

  const approvedQuestions = getApprovedQuizQuestions(allQuizQuestions);
  const eligible = byAgeAndDifficulty(
    approvedQuestions.filter((question) => question.category === gameId),
    age,
    difficulty
  );

  return shuffleArray(eligible).slice(0, age <= 3 ? 8 : 10);
}

export function getMatchingPairs(age: Age, difficulty: Difficulty): MatchingPair[] {
  const list = byAgeAndDifficulty(matchingPairs, age, difficulty);
  return shuffleArray(list).slice(0, age <= 3 ? 4 : age <= 4 ? 5 : 6);
}

export function getMemoryCards(age: Age, difficulty: Difficulty): MemoryCard[] {
  const exactPairIds = new Set(
    memoryCards.filter((card) => card.age.includes(age) && card.difficulty === difficulty).map((card) => card.pairId)
  );
  const fallbackPairIds = new Set(memoryCards.filter((card) => card.age.includes(age)).map((card) => card.pairId));
  const pairIds = exactPairIds.size >= 3 ? exactPairIds : fallbackPairIds;
  const maxPairs = age <= 3 ? 4 : age <= 4 ? 5 : 6;
  const selectedPairIds = shuffleArray([...pairIds]).slice(0, maxPairs);
  return shuffleArray(memoryCards.filter((card) => selectedPairIds.includes(card.pairId)));
}

export function getPatternPuzzles(age: Age, difficulty: Difficulty): PatternPuzzle[] {
  const list = byAgeAndDifficulty(patternPuzzles, age, difficulty);
  return shuffleArray(list).slice(0, age <= 4 ? 5 : 7);
}

export function getSortingChallenges(age: Age, difficulty: Difficulty): SortingChallenge[] {
  const list = byAgeAndDifficulty(sortingChallenges, age, difficulty);
  return shuffleArray(list).slice(0, age <= 3 ? 5 : 7);
}
