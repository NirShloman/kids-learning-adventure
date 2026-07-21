import { Age, Difficulty, GameId } from './game.types';
import type { ImageAssetId } from '../assets/assetManifest';

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
  value: string;
  imageAssetId?: ImageAssetId;
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
  schemaVersion: 1;
  contentVersion: string;
  gameId: GameId;
  items: T[];
}

export interface ContentReviewStatus {
  linguistic: 'approved';
  conceptual: 'approved';
  ageFit: 'approved';
  reviewedAt: string;
}
