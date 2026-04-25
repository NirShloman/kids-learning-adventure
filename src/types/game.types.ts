export type GameId = 'letters' | 'numbers' | 'shapes' | 'colors' | 'matching' | 'memory';
export type Age = 3 | 4 | 5 | 6;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameAccent = 'purple' | 'blue' | 'orange' | 'pink' | 'green' | 'yellow';

export interface GameDefinition {
  id: GameId;
  title: string;
  emoji: string;
  description: string;
  accent: GameAccent;
  recommendedAges: Age[];
}

export interface GameResult {
  score: number;
  total: number;
  stars: number;
}

export interface LearnerSettings {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
}
