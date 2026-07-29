import type { CSSProperties, ReactNode } from 'react';
import type {
  CharacterAnimationState,
  FacingDirection,
  LearnerGender
} from '../../../types';
import {
  resolveCharacterFrame,
  resolveCharacterSkin
} from './experienceAssetManifest';

interface ExperienceCharacterProps {
  gender: LearnerGender;
  learnerName: string;
  animation: CharacterAnimationState;
  facing: FacingDirection;
  tick: number;
  clipStartTick?: number;
  carried?: ReactNode;
}

export function ExperienceCharacter({
  gender,
  learnerName,
  animation,
  facing,
  tick,
  clipStartTick = 0,
  carried
}: ExperienceCharacterProps) {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skin = resolveCharacterSkin(gender);
  const resolved = resolveCharacterFrame(
    skin,
    animation,
    facing,
    tick,
    clipStartTick,
    reducedMotion
  );
  const horizontal = (resolved.framePosition.column / Math.max(1, resolved.atlas.grid.columns - 1)) * 100;
  const vertical = (resolved.framePosition.row / Math.max(1, resolved.atlas.grid.rows - 1)) * 100;
  const label = learnerName
    ? `${learnerName} בתנועה`
    : gender === 'girl'
      ? 'הילדה במשחק'
      : 'הילד במשחק';
  const style = {
    backgroundImage: `url(${resolved.atlas.webp})`,
    backgroundPosition: `${horizontal}% ${vertical}%`,
    backgroundSize: `${resolved.atlas.grid.columns * 100}% ${resolved.atlas.grid.rows * 100}%`,
    '--experience-carry-x': `${resolved.frame.attachment.x * 100}%`,
    '--experience-carry-y': `${resolved.frame.attachment.y * 100}%`
  } as CSSProperties;

  return (
    <span
      className={`experience-character experience-character--${animation} experience-character--facing-${facing}`}
      role="img"
      aria-label={label}
      data-gender={gender}
      data-skin={skin}
      data-animation={animation}
      data-facing={facing}
      data-frame={resolved.frame.name}
      data-frame-index={resolved.frame.index}
      data-clip={resolved.clip.key}
      style={style}
    >
      {carried ? <span className="experience-player__carried" aria-hidden="true">{carried}</span> : null}
    </span>
  );
}
