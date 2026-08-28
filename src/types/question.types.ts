import { Age, Difficulty, GameId } from './game.types';
import type { ImageAssetId } from '../assets/assetManifest';
import type { EvidenceForm, SkillId } from './learning.types';

export interface QuizOption {
  id: string;
  label: string;
  emoji?: string;
}

export interface ContentItemBase {
  id: string;
  ages: Age[];
  difficulty: Difficulty;
  skill: string;
  /** Stable pedagogical metadata used for QA and repeat avoidance. */
  taskFamily: string;
  conceptKey: string;
  variantKey: string;
  visualRole: 'stimulus' | 'context' | 'direct-match' | 'none';
  skillIds?: SkillId[];
  evidenceForm?: EvidenceForm;
}

export interface QuizQuestion extends ContentItemBase {
  id: string;
  category: Extract<GameId, 'letters' | 'numbers' | 'shapes' | 'colors'>;
  prompt: string;
  subtitle?: string;
  visual?: string;
  imageAssetId?: ImageAssetId;
  audioText?: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface MatchingPair extends ContentItemBase {
  left: string;
  right: string;
  leftImageAssetId?: ImageAssetId;
  rightImageAssetId?: ImageAssetId;
}

export interface MemoryPair extends ContentItemBase {
  leftValue: string;
  rightValue: string;
  leftImageAssetId?: ImageAssetId;
  rightImageAssetId?: ImageAssetId;
}

export interface MemoryCard extends ContentItemBase {
  pairId: string;
  value: string;
  imageAssetId?: ImageAssetId;
}

export interface PatternPuzzle extends ContentItemBase {
  prompt: string;
  sequence: string[];
  imageAssetIds?: ImageAssetId[];
  options: QuizOption[];
  correctOptionId: string;
  audioText?: string;
}

export interface SortingChallenge extends ContentItemBase {
  prompt: string;
  item: string;
  itemName: string;
  itemImageAssetId?: ImageAssetId;
  categoryImageAssetId?: ImageAssetId;
  options: QuizOption[];
  correctOptionId: string;
  audioText?: string;
}

export interface ContentEnvelope<T extends ContentItemBase> {
  schemaVersion: 2;
  contentVersion: string;
  gameId: GameId;
  items: T[];
}

export interface ContentReviewStatus {
  status: 'pending' | 'in-review' | 'ai-reviewed' | 'approved' | 'rejected';
  provenance: string;
  reviewer: string | null;
  expertise: string | null;
  reviewerType: 'ai-simulation' | 'human' | null;
  linguistic: 'pending' | 'approved' | 'rejected';
  conceptual: 'pending' | 'approved' | 'rejected';
  ageFit: 'pending' | 'approved' | 'rejected';
  clarity: 'pending' | 'approved' | 'rejected' | 'legacy-approved';
  visualLeak: 'pending' | 'approved' | 'rejected';
  focusGroupLenses: string[];
  reviewedAt: string | null;
  notes: string;
  contentHash: string;
}
