export type GameId = 'letters' | 'numbers' | 'shapes' | 'colors' | 'matching' | 'memory' | 'patterns' | 'sorting';
export type Age = 3 | 4 | 5 | 6;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameAccent = 'purple' | 'blue' | 'orange' | 'pink' | 'green' | 'yellow' | 'teal' | 'coral';

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

export interface PlayerProfile {
  id: string;
  name: string;
  age: Age;
  difficulty: Difficulty;
  createdAt: string;
}

export interface GameSession {
  id: string;
  playerId: string;
  gameId: GameId;
  gameTitle: string;
  age: Age;
  difficulty: Difficulty;
  score: number;
  total: number;
  stars: number;
  completedAt: string;
  syncStatus?: 'local' | 'pending' | 'synced';
}
