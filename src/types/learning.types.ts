import type { Age, Difficulty, GameId, LearnerGender } from './game.types';

export type SkillId =
  | 'foundation.visual-discrimination'
  | 'foundation.auditory-discrimination'
  | 'hebrew.letter-recognition'
  | 'hebrew.letter-sound'
  | 'hebrew.sound-position'
  | 'hebrew.first-words'
  | 'math.numeral-recognition'
  | 'math.quantity-sense'
  | 'concept.shape'
  | 'concept.color'
  | 'cognition.matching'
  | 'cognition.memory'
  | 'cognition.sequence'
  | 'cognition.sorting'
  | 'motor.fine'
  | 'cognition.problem-solving'
  | 'readiness.grade-one';

export type EvidenceForm =
  | 'visual-choice'
  | 'listening-choice'
  | 'matching'
  | 'memory'
  | 'sequence'
  | 'sorting'
  | 'adventure-drag'
  | 'adventure-navigation'
  | 'shared-turn'
  | 'shared-cooperation';

export type MasteryStatus =
  | 'new'
  | 'exposed'
  | 'practicing'
  | 'almost-mastered'
  | 'mastered'
  | 'needs-reinforcement';

export interface SkillDefinition {
  id: SkillId;
  parentId?: SkillId;
  name: string;
  description: string;
  targetAges: Age[];
  prerequisites: SkillId[];
  levels: string[];
  evidenceForms: EvidenceForm[];
  masteryThreshold: number;
  reinforcementAfterDays: number;
  minimumContentByAge: Partial<Record<Age, number>>;
  offScreenIdea: string;
  evidenceLimit?: 'infrastructure-only' | 'partial';
}

export interface AccessibilitySettings {
  noTimeLimit: boolean;
  reducedMotion: boolean;
  reducedParticles: boolean;
  reducedBackgroundAudio: boolean;
  fewerItems: boolean;
  largeTouchTargets: boolean;
  highContrast: boolean;
  slowNarration: boolean;
  extendedResponseTime: boolean;
  disableMovingObstacles: boolean;
  strongGuidance: boolean;
  strongSnap: boolean;
}

export interface LearnerProfile {
  id: string;
  name: string;
  age: Age;
  gender: LearnerGender | null;
  avatarId: 'nir-kippah' | 'nir-plain' | 'shir';
  learningMode: 'automatic' | 'manual';
  manualDifficulty: Difficulty;
  narrationEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicEnabled: boolean;
  narrationVolume: number;
  soundEffectsVolume: number;
  musicVolume: number;
  accessibility: AccessibilitySettings;
  createdAt: string;
  updatedAt: string;
}

export interface LearningEvent {
  id: string;
  profileId: string;
  sessionId: string;
  contentId: string;
  skillIds: SkillId[];
  gameId: GameId;
  evidenceForm: EvidenceForm;
  correct: boolean;
  attemptNumber: number;
  hintUsed: boolean;
  responseMs: number | null;
  monotonicMs: number | null;
  occurredAt: string;
  effectiveDay: string;
}

export interface SkillMastery {
  skillId: SkillId;
  status: MasteryStatus;
  confidence: number;
  evidenceCount: number;
  correctCount: number;
  recentOutcomes: boolean[];
  evidenceForms: EvidenceForm[];
  intervalStep: number;
  dueAt: string | null;
  lastPracticedAt: string | null;
  lastContentId: string | null;
}

export interface SessionTask {
  id: string;
  contentId: string;
  gameId: GameId;
  skillIds: SkillId[];
  evidenceForm: EvidenceForm;
  difficulty: Difficulty;
  kind: 'focus' | 'review' | 'stretch' | 'confidence';
  reason: string;
  estimatedSeconds: number;
  completed: boolean;
}

export interface SessionPlan {
  id: string;
  profileId: string;
  createdAt: string;
  estimatedMinutes: number;
  tasks: SessionTask[];
  completedAt: string | null;
}

export interface LearningSessionSummary {
  id: string;
  profileId: string;
  gameId?: GameId;
  mode: 'adaptive' | 'manual' | 'shared-turns' | 'shared-cooperation';
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  correct: number;
  total: number;
}

export interface JourneyProgress {
  unlockedWorlds: GameId[];
  completedLevelIds: string[];
  decorationIds: string[];
}

export interface ProfileLearningData {
  mastery: Partial<Record<SkillId, SkillMastery>>;
  events: LearningEvent[];
  sessions: LearningSessionSummary[];
  recentContent: Record<string, string[]>;
  activePlan: SessionPlan | null;
  journey: JourneyProgress;
  lastEffectiveNow: string;
  dailyContentCounts: Record<string, number>;
}

export interface LearningSnapshotV4 {
  schemaVersion: 4;
  migrationState: 'complete';
  activeProfileId: string | null;
  profiles: LearnerProfile[];
  dataByProfile: Record<string, ProfileLearningData>;
  updatedAt: string;
}

export interface LearningContentDescriptor {
  id: string;
  gameId: GameId;
  ages: Age[];
  difficulty: Difficulty;
  skillIds: SkillId[];
  evidenceForm: EvidenceForm;
}
