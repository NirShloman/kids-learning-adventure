import type {
  Age,
  Difficulty,
  ExperienceGameId,
  SkillId,
  EvidenceForm,
} from "./index";

export type Activity =
  | "letter-build"
  | "letter-find"
  | "letter-sign"
  | "order"
  | "share"
  | "complete"
  | "shape-fit"
  | "shape-turn"
  | "shape-build"
  | "paint"
  | "mix"
  | "color-apply";
export type Shape =
  | "circle"
  | "square"
  | "triangle"
  | "rectangle"
  | "oval"
  | "star";
export type PaintColor =
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "orange"
  | "purple"
  | "pink"
  | "brown";
export interface AdventureMission {
  id: string;
  gameId: ExperienceGameId;
  activity: Activity;
  title: string;
  story: string;
  instruction: string;
  reward: string;
  skillIds: SkillId[];
  evidenceForm: EvidenceForm;
  variant: number;
  letterSet?: string;
  shapes?: Shape[];
  colors?: PaintColor[];
}
export interface AdventureSettings {
  age: Age;
  difficulty: Difficulty;
  fewerItems?: boolean;
}
export interface AdventureStep {
  id: string;
  kind: "place" | "choose" | "count" | "paint" | "mix";
  prompt: string;
  answer: string;
  options: string[];
  target: string;
  count?: number;
  initial?: number;
  rotation?: number;
  part?: number;
  parts?: number;
  word?: string;
}
export interface AdventureProgress {
  version: 1;
  completed: string[];
  rewards: string[];
  recent: string[];
  creations?: Array<{
    id: string;
    missionId: string;
    seed: number;
    completedAt: string;
  }>;
  checkpoint?: AdventureCheckpoint;
}
export interface AdventureCheckpoint {
  sessionId: string;
  missionIds: string[];
  missionIndex: number;
  stepIndex: number;
  attempt: number;
  hint: boolean;
  seed: number;
  age: Age;
  difficulty: Difficulty;
  challenge?: Difficulty;
  fewerItems?: boolean;
  evidenceKeys: string[];
}
