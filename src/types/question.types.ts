import { Age, Difficulty, GameId } from './game.types';

export interface QuizOption {
  id: string;
  label: string;
  emoji?: string;
}

export interface QuizQuestion {
  id: string;
  category: Extract<GameId, 'letters' | 'numbers' | 'shapes' | 'colors'>;
  age: Age[];
  difficulty: Difficulty;
  prompt: string;
  subtitle?: string;
  visual?: string;
  audioText?: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  age: Age[];
  difficulty: Difficulty;
}

export interface MemoryCard {
  id: string;
  pairId: string;
  value: string;
  age: Age[];
  difficulty: Difficulty;
}
