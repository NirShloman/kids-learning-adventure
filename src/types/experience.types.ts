import type { Age, Difficulty, GameId } from './game.types';
import type { ImageAssetId } from '../assets/assetManifest';

export type ExperienceGameId = Extract<GameId, 'letters' | 'numbers' | 'shapes' | 'colors'>;
export type GameCommand = 'up' | 'down' | 'left' | 'right' | 'action';
export type FacingDirection = 'front' | 'back' | 'left' | 'right';
export type CharacterAnimationState = 'idle' | 'walk' | 'carry-walk' | 'pickup' | 'drop' | 'celebrate';
export interface ExperienceVector { x: number; y: number }
export interface ExperienceInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}
export interface PhysicsTuning {
  maxSpeed: number;
  acceleration: number;
  braking: number;
  playerRadius: number;
  interactionRadius: number;
  snapRadius: number;
  guideStrength: number;
}
export interface ExperienceObstacle {
  id: string;
  position: ExperienceVector;
  width: number;
  height: number;
  kind: 'wall' | 'bumper';
  axis?: 'x' | 'y';
  travel?: number;
  speed?: number;
}
export interface ExperienceWorld {
  width: number;
  height: number;
  seed: number;
  obstacles: ExperienceObstacle[];
}
export type ExperienceSpriteId =
  | 'explorer' | 'monster' | 'brush'
  | 'paint-red' | 'paint-blue' | 'paint-yellow' | 'paint-green'
  | 'apple' | 'strawberry' | 'flower' | 'balloon' | 'letter-block'
  | 'square' | 'triangle' | 'circle' | 'star';

export interface ExperienceEntity {
  id: string;
  label: string;
  imageAssetId?: ImageAssetId;
  sprite?: ExperienceSpriteId;
  fallbackGlyph?: string;
  kind: 'collectible' | 'station' | 'target';
  x: number;
  y: number;
  position?: ExperienceVector;
  radius?: number;
  bodyType?: 'static' | 'dynamic' | 'sensor';
  accepts?: string;
  color?: string;
}

export interface ExperienceLevel {
  id: string;
  gameId: ExperienceGameId;
  ages: Age[];
  difficulty: Difficulty[];
  title: string;
  instruction: string;
  successText: string;
  gridSize: number;
  playerStart: { x: number; y: number };
  world?: ExperienceWorld;
  required: number;
  entities: ExperienceEntity[];
}
