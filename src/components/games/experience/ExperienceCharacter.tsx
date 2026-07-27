import type { CharacterAnimationState, FacingDirection, LearnerGender } from '../../../types';
import { imageAssets } from '../../../assets/assetManifest';

interface ExperienceCharacterProps {
  gender: LearnerGender;
  learnerName: string;
  animation: CharacterAnimationState;
  facing: FacingDirection;
  tick: number;
}

type CharacterPose =
  | 'idle-front'
  | 'walk-side-1'
  | 'walk-side-2'
  | 'walk-back'
  | 'carry-front'
  | 'carry-side'
  | 'pickup'
  | 'celebrate';

const columns: Record<CharacterPose, number> = {
  'idle-front': 0,
  'walk-side-1': 1,
  'walk-side-2': 2,
  'walk-back': 3,
  'carry-front': 0,
  'carry-side': 1,
  pickup: 2,
  celebrate: 3
};

function resolvePose(animation: CharacterAnimationState, facing: FacingDirection, tick: number): CharacterPose {
  if (animation === 'celebrate') return 'celebrate';
  if (animation === 'pickup' || animation === 'drop') return 'pickup';
  if (animation === 'carry-walk') return facing === 'left' || facing === 'right' ? 'carry-side' : 'carry-front';
  if (animation === 'walk') {
    if (facing === 'back') return 'walk-back';
    if (facing === 'left' || facing === 'right') return tick % 24 < 12 ? 'walk-side-1' : 'walk-side-2';
  }
  return 'idle-front';
}

export function ExperienceCharacter({ gender, learnerName, animation, facing, tick }: ExperienceCharacterProps) {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pose = resolvePose(animation, facing, reducedMotion ? 0 : tick);
  const rowBase = gender === 'girl' ? 2 : 0;
  const row = rowBase + (['carry-front', 'carry-side', 'pickup', 'celebrate'].includes(pose) ? 1 : 0);
  const positions = [0, 33.333, 66.667, 100];
  const label = learnerName ? `${learnerName} בתנועה` : gender === 'girl' ? 'הילדה במשחק' : 'הילד במשחק';
  return (
    <span
      className={`experience-character experience-character--${animation} experience-character--facing-${facing}`}
      role="img"
      aria-label={label}
      data-gender={gender}
      data-animation={animation}
      data-facing={facing}
      style={{
        backgroundImage: `url(${imageAssets.characterSprites})`,
        backgroundPosition: `${positions[columns[pose]]}% ${positions[row]}%`,
        backgroundSize: '400% 400%'
      }}
    />
  );
}
