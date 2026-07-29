export type GameId = 'letters' | 'numbers' | 'shapes' | 'colors' | 'matching' | 'memory' | 'patterns' | 'sorting';
export type GameMode = 'experience' | 'quiz';
export type Age = 3 | 4 | 5 | 6;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameAccent = 'purple' | 'blue' | 'orange' | 'pink' | 'green' | 'yellow' | 'teal' | 'coral';
export type LearnerGender = 'boy' | 'girl';

export interface GameDefinition {
  id: GameId;
  title: string;
  emoji: string;
  description: string;
  accent: GameAccent;
  recommendedAges: Age[];
  imageAssetId?: import('../assets/assetManifest').ImageAssetId;
  backgroundAssetId?: import('../assets/assetManifest').ImageAssetId;
}

export interface GameResult {
  score: number;
  total: number;
  stars: number;
}

export interface LearnerSettings {
  age: Age;
  difficulty: Difficulty;
  /** Compatibility alias used by existing game components. */
  voiceEnabled: boolean;
  narrationEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicEnabled: boolean;
}

export interface LocalLearnerState extends LearnerSettings {
  schemaVersion: 3;
  name: string;
  gender: LearnerGender | null;
  profileCompleted: boolean;
  migratedFromLegacy: boolean;
  updatedAt: string;
}

export interface LocalGameSession {
  id: string;
  gameId: GameId;
  gameTitle: string;
  mode?: GameMode;
  age: Age;
  difficulty: Difficulty;
  score: number;
  total: number;
  stars: number;
  completedAt: string;
}
