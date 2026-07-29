import rawCharacterAtlases from '../../../content/character-atlases.json';
import rawExperienceAssets from '../../../content/experience-assets.json';
import type {
  CharacterAnimationClip,
  CharacterAnimationState,
  CharacterAtlasFrame,
  CharacterAtlasManifest,
  CharacterSkin,
  FacingDirection,
  LearnerGender
} from '../../../types';

interface ExperienceAssetRecord {
  id: string;
  world: string;
  png: string;
  webp: string;
  width: number;
  height: number;
  source: string;
}
interface ResolvedCharacterFrame {
  atlas: CharacterAtlasManifest;
  clip: CharacterAnimationClip;
  frame: CharacterAtlasFrame;
  framePosition: { column: number; row: number };
  mirrored: boolean;
}

const characterAtlases = rawCharacterAtlases.atlases as Record<CharacterSkin, CharacterAtlasManifest>;
const experienceAssets = rawExperienceAssets.entries as Record<string, ExperienceAssetRecord>;

export function resolveCharacterSkin(gender: LearnerGender): CharacterSkin {
  return gender === 'girl' ? 'shir' : 'nir-kippah';
}

export function getCharacterAtlas(skin: CharacterSkin): CharacterAtlasManifest {
  return characterAtlases[skin];
}

export function getExperienceAsset(assetId: string | undefined): ExperienceAssetRecord | undefined {
  return assetId ? experienceAssets[assetId] : undefined;
}

export function getExperienceAssetIds(): string[] {
  return Object.keys(experienceAssets);
}

function clipKeyFor(animation: CharacterAnimationState, facing: FacingDirection): string {
  if (animation === 'pickup' || animation === 'drop' || animation === 'celebrate') return animation;
  const direction = facing === 'left' || facing === 'right' ? 'side' : facing;
  if (animation === 'carry-walk') return `carry_${direction}`;
  if (animation === 'walk') return `walk_${direction}`;
  return `idle_${direction}`;
}

export function resolveCharacterFrame(
  skin: CharacterSkin,
  animation: CharacterAnimationState,
  facing: FacingDirection,
  tick: number,
  clipStartTick: number,
  reducedMotion: boolean
): ResolvedCharacterFrame {
  const atlas = getCharacterAtlas(skin);
  const key = clipKeyFor(animation, facing);
  const clip = atlas.animations.find((candidate) => candidate.key === key)
    ?? atlas.animations.find((candidate) => candidate.key === 'idle_front');
  if (!clip) throw new Error(`Missing animation clip ${key} for ${skin}`);

  const elapsedTicks = Math.max(0, tick - clipStartTick);
  const rawIndex = reducedMotion
    ? 0
    : Math.floor((elapsedTicks / 60) * clip.frameRate);
  const clipIndex = clip.repeat === -1
    ? rawIndex % clip.frames.length
    : Math.min(rawIndex, clip.frames.length - 1);
  const frameName = clip.frames[clipIndex];
  const frame = atlas.frames.find((candidate) => candidate.name === frameName);
  if (!frame) throw new Error(`Missing frame ${frameName} for ${skin}`);

  return {
    atlas,
    clip,
    frame,
    framePosition: {
      column: frame.index % atlas.grid.columns,
      row: Math.floor(frame.index / atlas.grid.columns)
    },
    mirrored: facing === 'left'
  };
}

export function getAnimationDurationMs(
  skin: CharacterSkin,
  animation: Extract<CharacterAnimationState, 'pickup' | 'drop' | 'celebrate'>
): number {
  const atlas = getCharacterAtlas(skin);
  const clip = atlas.animations.find((candidate) => candidate.key === animation);
  return clip ? Math.ceil((clip.frames.length / clip.frameRate) * 1000) : 400;
}
