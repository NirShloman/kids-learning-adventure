import { allQuizQuestions } from '../data/questions';
import { matchingPairs, memoryCards } from '../data/activityData';
import { Age, Difficulty, GameId, MatchingPair, MemoryCard, QuizQuestion } from '../types';
import { shuffleArray } from '../utils/helpers';

export function getQuizQuestions(gameId: GameId, age: Age, difficulty: Difficulty): QuizQuestion[] {
  if (!['letters', 'numbers', 'shapes', 'colors'].includes(gameId)) return [];

  const exact = allQuizQuestions.filter(
    (question) => question.category === gameId && question.age.includes(age) && question.difficulty === difficulty
  );

  const fallback = allQuizQuestions.filter((question) => question.category === gameId && question.age.includes(age));
  return shuffleArray(exact.length > 0 ? exact : fallback).slice(0, 8);
}

export function getMatchingPairs(age: Age, difficulty: Difficulty): MatchingPair[] {
  const exact = matchingPairs.filter((pair) => pair.age.includes(age) && pair.difficulty === difficulty);
  const fallback = matchingPairs.filter((pair) => pair.age.includes(age));
  const list = exact.length >= 3 ? exact : fallback;
  return shuffleArray(list).slice(0, age <= 3 ? 4 : 6);
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
