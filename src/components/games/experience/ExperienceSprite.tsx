import { imageAssets } from '../../../assets/assetManifest';
import type { ExperienceSpriteId } from '../../../types';

interface ExperienceSpriteProps {
  sprite: ExperienceSpriteId;
  label?: string;
  className?: string;
}

const spritePositions: Record<ExperienceSpriteId, [number, number]> = {
  explorer: [0, 0],
  monster: [1, 0],
  brush: [2, 0],
  'paint-red': [3, 0],
  'paint-blue': [0, 1],
  'paint-yellow': [1, 1],
  'paint-green': [2, 1],
  apple: [3, 1],
  strawberry: [0, 2],
  flower: [1, 2],
  balloon: [2, 2],
  'letter-block': [3, 2],
  square: [0, 3],
  triangle: [1, 3],
  circle: [2, 3],
  star: [3, 3]
};

export function ExperienceSprite({ sprite, label = '', className = '' }: ExperienceSpriteProps) {
  const [column, row] = spritePositions[sprite];
  const cropPositions = [4.69, 34.9, 65.1, 95.31];
  return (
    <span
      className={`experience-sprite experience-sprite--${sprite} ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      style={{
        backgroundImage: `url(${imageAssets.experienceSprites})`,
        backgroundPosition: `${cropPositions[column]}% ${cropPositions[row]}%`,
        backgroundSize: '580% 580%'
      }}
    />
  );
}
