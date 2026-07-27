import type {
  Age,
  Difficulty,
  ExperienceLevel,
  ExperienceObstacle,
  ExperienceVector,
  ExperienceWorld,
  PhysicsTuning
} from '../types';

export const EXPERIENCE_WORLD_SIZE = { width: 1000, height: 620 } as const;

const targetItemCount: Record<Difficulty, number> = {
  easy: 3,
  medium: 4,
  hard: 5
};

const ageTuning: Record<Age, Omit<PhysicsTuning, 'guideStrength'>> = {
  3: { maxSpeed: 155, acceleration: 0.16, braking: 0.74, playerRadius: 43, interactionRadius: 92, snapRadius: 104 },
  4: { maxSpeed: 175, acceleration: 0.18, braking: 0.72, playerRadius: 40, interactionRadius: 82, snapRadius: 92 },
  5: { maxSpeed: 195, acceleration: 0.2, braking: 0.69, playerRadius: 37, interactionRadius: 72, snapRadius: 82 },
  6: { maxSpeed: 215, acceleration: 0.22, braking: 0.66, playerRadius: 35, interactionRadius: 64, snapRadius: 72 }
};

const difficultyGuide: Record<Difficulty, number> = {
  easy: 1,
  medium: 0.65,
  hard: 0.3
};

export function getPhysicsTuning(age: Age, difficulty: Difficulty): PhysicsTuning {
  return { ...ageTuning[age], guideStrength: difficultyGuide[difficulty] };
}

export function selectExperienceLevels(
  levels: ExperienceLevel[],
  gameId: ExperienceLevel['gameId'],
  age: Age,
  difficulty: Difficulty
): ExperienceLevel[] {
  const candidates = levels.filter((level) =>
    level.gameId === gameId
    && level.ages.includes(age)
    && level.difficulty.includes(difficulty)
  );
  const fallback = levels.filter((level) => level.gameId === gameId).slice(0, 1);
  if (!candidates.length) return fallback;
  const target = age === 3 ? 3 : targetItemCount[difficulty];
  const selected = [...candidates].sort((first, second) => {
    const firstDistance = Math.abs(first.required - target);
    const secondDistance = Math.abs(second.required - target);
    if (firstDistance !== secondDistance) return firstDistance - secondDistance;
    return difficulty === 'easy'
      ? first.required - second.required
      : second.required - first.required;
  })[0];
  if (selected.required <= target) return [selected];

  const keptCollectibles = selected.entities
    .filter((entity) => entity.kind === 'collectible')
    .slice(0, target);
  const keptTargets = selected.gameId === 'colors'
    ? selected.entities.filter((entity) => entity.kind === 'target').slice(0, target)
    : selected.gameId === 'shapes'
      ? selected.entities.filter((entity) => {
        if (entity.kind !== 'target') return false;
        return keptCollectibles.some((collectible) => collectible.accepts === entity.accepts);
      }).slice(0, target)
      : selected.entities.filter((entity) => entity.kind === 'target');
  const keptIds = new Set([...keptCollectibles, ...keptTargets].map((entity) => entity.id));
  return [{
    ...selected,
    required: target,
    entities: selected.entities.filter((entity) =>
      entity.kind === 'station' || keptIds.has(entity.id)
    )
  }];
}

export function gridPointToWorld(point: ExperienceVector, gridSize: number): ExperienceVector {
  const horizontalMargin = 105;
  const verticalMargin = 80;
  const columns = Math.max(1, gridSize - 1);
  return {
    x: horizontalMargin + (point.x / columns) * (EXPERIENCE_WORLD_SIZE.width - horizontalMargin * 2),
    y: verticalMargin + (point.y / columns) * (EXPERIENCE_WORLD_SIZE.height - verticalMargin * 2)
  };
}

function obstaclesFor(difficulty: Difficulty, seed: number): ExperienceObstacle[] {
  if (difficulty === 'easy') return [];
  const medium: ExperienceObstacle[] = [
    { id: `wall-${seed}-1`, position: { x: 500, y: 315 }, width: 170, height: 30, kind: 'wall' }
  ];
  if (difficulty === 'medium') return medium;
  return [
    ...medium,
    { id: `wall-${seed}-2`, position: { x: 265, y: 255 }, width: 28, height: 150, kind: 'wall' },
    {
      id: `bumper-${seed}`,
      position: { x: 735, y: 350 },
      width: 42,
      height: 42,
      kind: 'bumper',
      axis: seed % 2 ? 'x' : 'y',
      travel: 72,
      speed: 0.0011
    }
  ];
}

export function resolveExperienceWorld(level: ExperienceLevel, difficulty: Difficulty): ExperienceWorld {
  if (level.world) return level.world;
  const seed = [...level.id].reduce((total, character) => total + character.charCodeAt(0), 0);
  return {
    ...EXPERIENCE_WORLD_SIZE,
    seed,
    obstacles: obstaclesFor(difficulty, seed)
  };
}

export function resolveEntityPosition(level: ExperienceLevel, entity: { x: number; y: number; position?: ExperienceVector }): ExperienceVector {
  return entity.position ?? gridPointToWorld({ x: entity.x, y: entity.y }, level.gridSize);
}

export function resolvePlayerStart(level: ExperienceLevel): ExperienceVector {
  return gridPointToWorld(level.playerStart, level.gridSize);
}
