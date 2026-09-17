import type {
  ContentItemBase,
  GameId,
  QuizOption,
  VisualToken,
  Age,
  Difficulty,
} from "./index";

export type DiscoveryScope = GameId | "mixed";
export type DetectiveOutcome = "independent" | "assisted" | "demonstrated";
export interface DetectiveItem extends ContentItemBase {
  prompt?: string;
  audioText?: string;
  category?: GameId;
  options?: QuizOption[];
  correctOptionId?: string;
  left?: string;
  right?: string;
  leftValue?: string;
  rightValue?: string;
  leftVisual?: VisualToken;
  rightVisual?: VisualToken;
}
export interface DetectiveStep {
  gameId: GameId;
  ids: string[];
}
export interface DetectiveRound {
  id: string;
  contentVersion: string;
  age: Age;
  difficulty: Difficulty;
  startedAt: string;
  steps: DetectiveStep[];
  index: number;
  outcomes: Record<string, DetectiveOutcome>;
  attempts: Record<string, number>;
  hinted: string[];
  wrongOptions: Record<string, string[]>;
}
export interface DiscoveryResult {
  id: string;
  scope: DiscoveryScope;
  completedAt: string;
  independent: number;
  assisted: number;
  demonstrated: number;
}
export interface DetectiveProgress {
  rounds: Partial<Record<DiscoveryScope, DetectiveRound>>;
  discoveries: DiscoveryResult[];
  last?: DiscoveryResult;
}
