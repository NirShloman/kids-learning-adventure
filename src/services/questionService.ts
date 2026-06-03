import { Age, Difficulty, GameId, MatchingPair, MemoryCard, PatternPuzzle, QuizQuestion, SortingChallenge } from '../types';
import { shuffleArray } from '../utils/helpers';
import { loadQuestionBank } from './questionCacheService';
import { getPlayableQuizQuestions } from './questions/questionProvider';

const quizGameIds: QuizQuestion['category'][] = ['letters', 'numbers', 'shapes', 'colors'];

function byAgeAndDifficulty<T extends { age: Age[]; difficulty: Difficulty }>(items: T[], age: Age, difficulty: Difficulty): T[] {
  const exact = items.filter((item) => item.age.includes(age) && item.difficulty === difficulty);
  const fallback = items.filter((item) => item.age.includes(age));
  return exact.length > 0 ? exact : fallback;
}

export async function getQuizQuestions(gameId: GameId, age: Age, difficulty: Difficulty): Promise<QuizQuestion[]> {
  if (!quizGameIds.includes(gameId as QuizQuestion['category'])) return [];

  const eligible = await getPlayableQuizQuestions(gameId as QuizQuestion['category'], age, difficulty);

  return shuffleArray(eligible).slice(0, age <= 3 ? 8 : 10);
}

export async function getMatchingPairs(age: Age, difficulty: Difficulty): Promise<MatchingPair[]> {
  const questionBank = await loadQuestionBank();
  const list = byAgeAndDifficulty(questionBank.matchingPairs, age, difficulty);
  return shuffleArray(list).slice(0, age <= 3 ? 4 : age <= 4 ? 5 : 6);
}

export async function getMemoryCards(age: Age, difficulty: Difficulty): Promise<MemoryCard[]> {
  const questionBank = await loadQuestionBank();
  const memoryCards = questionBank.memoryCards;
  const exactPairIds = new Set(
    memoryCards.filter((card) => card.age.includes(age) && card.difficulty === difficulty).map((card) => card.pairId)
  );
  const fallbackPairIds = new Set(memoryCards.filter((card) => card.age.includes(age)).map((card) => card.pairId));
  const pairIds = exactPairIds.size >= 3 ? exactPairIds : fallbackPairIds;
  const maxPairs = age <= 3 ? 4 : age <= 4 ? 5 : 6;
  const selectedPairIds = shuffleArray([...pairIds]).slice(0, maxPairs);
  return shuffleArray(memoryCards.filter((card) => selectedPairIds.includes(card.pairId)));
}

export async function getPatternPuzzles(age: Age, difficulty: Difficulty): Promise<PatternPuzzle[]> {
  const questionBank = await loadQuestionBank();
  const list = byAgeAndDifficulty(questionBank.patternPuzzles, age, difficulty);
  return shuffleArray(list).slice(0, age <= 4 ? 5 : 7);
}

export async function getSortingChallenges(age: Age, difficulty: Difficulty): Promise<SortingChallenge[]> {
  const questionBank = await loadQuestionBank();
  const list = byAgeAndDifficulty(questionBank.sortingChallenges, age, difficulty);
  return shuffleArray(list).slice(0, age <= 3 ? 5 : 7);
}
