import { Age, Difficulty, GameId } from './game.types';
import type { ImageAssetId } from '../assets/assetManifest';

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
  imageAssetId?: ImageAssetId;
  audioText?: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
  leftImageAssetId?: ImageAssetId;
  rightImageAssetId?: ImageAssetId;
  age: Age[];
  difficulty: Difficulty;
}

export interface MemoryCard {
  id: string;
  pairId: string;
  value: string;
  imageAssetId?: ImageAssetId;
  age: Age[];
  difficulty: Difficulty;
}

export interface PatternPuzzle {
  id: string;
  age: Age[];
  difficulty: Difficulty;
  prompt: string;
  sequence: string[];
  imageAssetIds?: ImageAssetId[];
  options: QuizOption[];
  correctOptionId: string;
  audioText?: string;
}

export interface SortingChallenge {
  id: string;
  age: Age[];
  difficulty: Difficulty;
  prompt: string;
  item: string;
  itemName: string;
  itemImageAssetId?: ImageAssetId;
  categoryImageAssetId?: ImageAssetId;
  options: QuizOption[];
  correctOptionId: string;
  audioText?: string;
}

export type LearningWorldId =
  | GameId
  | 'phonology'
  | 'readiness'
  | 'emotions'
  | 'instructions';

export type SkillId =
  | 'letters'
  | 'initial-sound'
  | 'phonemic-awareness'
  | 'rhyming'
  | 'numbers'
  | 'counting'
  | 'shapes'
  | 'colors'
  | 'matching'
  | 'memory'
  | 'categories'
  | 'sequences'
  | 'emotions'
  | 'first-grade-readiness'
  | 'short-words'
  | 'simple-instructions';

export type AgeRange = '3-4' | '4-5' | '5-6';
export type QuestionDifficulty = 1 | 2 | 3 | 4 | 5;
export type QuestionStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_changes' | 'archived';
export type QuestionType =
  | 'single-choice'
  | 'image-choice'
  | 'audio-choice'
  | 'matching'
  | 'sequence'
  | 'memory'
  | 'word-building'
  | 'category'
  | 'emotion';

export type QuestionCreator = 'system' | 'admin' | 'parent' | 'teacher' | 'content_editor';

export interface QuestionMedia {
  imageUrl?: string;
  audioUrl?: string;
  illustrationKey?: string;
}

export interface GameOption {
  id: string;
  text: string;
  media?: QuestionMedia;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  isSimilar: boolean;
  similarityScore: number;
  matchedQuestionIds: string[];
  reason?: string;
}

export type ReviewRole =
  | 'speech_language_pathologist'
  | 'early_childhood_teacher'
  | 'first_grade_readiness_teacher'
  | 'accessibility_specialist'
  | 'child_safety_reviewer'
  | 'hebrew_content_editor';

export interface ReviewRoleReport {
  role: ReviewRole;
  score: number;
  notes: string[];
}

export interface ReviewIssue {
  severity: 'info' | 'warning' | 'critical';
  field: string;
  message: string;
  suggestion?: string;
}

export interface QuestionReviewReport {
  approved: boolean;
  status: Extract<QuestionStatus, 'approved' | 'rejected' | 'needs_changes'>;
  overallScore: number;
  ageFitScore: number;
  clarityScore: number;
  languageScore: number;
  pedagogyScore: number;
  safetyScore: number;
  diversityScore: number;
  accessibilityScore: number;
  reviewerRoles: ReviewRoleReport[];
  issues: ReviewIssue[];
  suggestions: string[];
  finalRecommendation: string;
}

export interface GameQuestion {
  id: string;
  prompt: string;
  options: GameOption[];
  correctOptionId: string;
  worldId: LearningWorldId;
  skillId: SkillId;
  ageRange: AgeRange;
  difficulty: QuestionDifficulty;
  questionType: QuestionType;
  media?: QuestionMedia;
  language: 'he';
  tags: string[];
  estimatedTimeSeconds: number;
  pedagogicalGoal: string;
  explanationForParent?: string;
  hint?: string;
  audioText?: string;
  status: QuestionStatus;
  review?: QuestionReviewReport;
  duplicate?: DuplicateCheckResult;
  createdBy: QuestionCreator;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  version: number;
}

export interface ContentVersion {
  versionId: string;
  name: string;
  createdAt: string;
  approvedQuestionCount: number;
  ageRanges: AgeRange[];
  worlds: LearningWorldId[];
  changelog: string[];
  status: 'draft' | 'published' | 'archived';
}
