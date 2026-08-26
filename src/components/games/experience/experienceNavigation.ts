import type {
  ExperienceInputState,
  ExperienceNavigationIntent,
  ExperienceObstacle,
  ExperienceVector,
  ExperienceWorld,
  NavigationPath
} from '../../../types';

const CELL_SIZE = 40;
const DIRECTIONS = [
  { x: 1, y: 0, cost: 1 }, { x: -1, y: 0, cost: 1 },
  { x: 0, y: 1, cost: 1 }, { x: 0, y: -1, cost: 1 },
  { x: 1, y: 1, cost: Math.SQRT2 }, { x: 1, y: -1, cost: Math.SQRT2 },
  { x: -1, y: 1, cost: Math.SQRT2 }, { x: -1, y: -1, cost: Math.SQRT2 }
] as const;

interface Cell { x: number; y: number }

function key(cell: Cell): string { return `${cell.x}:${cell.y}`; }
function distance(a: Cell, b: Cell): number { return Math.hypot(a.x - b.x, a.y - b.y); }

function toCell(point: ExperienceVector, columns: number, rows: number): Cell {
  return {
    x: Math.max(0, Math.min(columns - 1, Math.floor(point.x / CELL_SIZE))),
    y: Math.max(0, Math.min(rows - 1, Math.floor(point.y / CELL_SIZE)))
  };
}

function toPoint(cell: Cell, world: ExperienceWorld): ExperienceVector {
  return {
    x: Math.min(world.width, cell.x * CELL_SIZE + CELL_SIZE / 2),
    y: Math.min(world.height, cell.y * CELL_SIZE + CELL_SIZE / 2)
  };
}

function isBlocked(
  cell: Cell,
  world: ExperienceWorld,
  obstacles: ExperienceObstacle[],
  obstaclePositions: Record<string, ExperienceVector>,
  clearance: number
): boolean {
  const point = toPoint(cell, world);
  if (point.x < clearance || point.x > world.width - clearance || point.y < clearance || point.y > world.height - clearance) return true;
  return obstacles.some((obstacle) => {
    const position = obstaclePositions[obstacle.id] ?? obstacle.position;
    return Math.abs(point.x - position.x) <= obstacle.width / 2 + clearance
      && Math.abs(point.y - position.y) <= obstacle.height / 2 + clearance;
  });
}

function simplify(points: ExperienceVector[]): ExperienceVector[] {
  if (points.length < 3) return points;
  const result = [points[0]];
  let previousDirection = '';
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const direction = `${Math.sign(current.x - previous.x)}:${Math.sign(current.y - previous.y)}`;
    if (previousDirection && direction !== previousDirection) result.push(previous);
    previousDirection = direction;
  }
  result.push(points[points.length - 1]);
  return result;
}

export function findNavigationPath(
  start: ExperienceVector,
  intent: ExperienceNavigationIntent,
  world: ExperienceWorld,
  obstaclePositions: Record<string, ExperienceVector>,
  playerRadius: number
): NavigationPath {
  const columns = Math.ceil(world.width / CELL_SIZE);
  const rows = Math.ceil(world.height / CELL_SIZE);
  const startCell = toCell(start, columns, rows);
  const targetCell = toCell(intent.target, columns, rows);
  const startKey = key(startCell);
  const targetKey = key(targetCell);
  const open = new Map<string, Cell>([[startKey, startCell]]);
  const cameFrom = new Map<string, string>();
  const cells = new Map<string, Cell>([[startKey, startCell]]);
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, distance(startCell, targetCell)]]);
  const clearance = playerRadius + 10;

  while (open.size) {
    const currentEntry = [...open.entries()].sort((a, b) => (fScore.get(a[0]) ?? Infinity) - (fScore.get(b[0]) ?? Infinity))[0];
    const [currentKey, current] = currentEntry;
    if (currentKey === targetKey) {
      const route: Cell[] = [current];
      let cursor = currentKey;
      while (cameFrom.has(cursor)) {
        cursor = cameFrom.get(cursor)!;
        route.unshift(cells.get(cursor)!);
      }
      const points = simplify(route.slice(1).map((cell) => toPoint(cell, world)));
      points.push({ ...intent.target });
      return { ...intent, waypoints: points };
    }
    open.delete(currentKey);

    for (const direction of DIRECTIONS) {
      const neighbor = { x: current.x + direction.x, y: current.y + direction.y };
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= columns || neighbor.y >= rows) continue;
      const neighborKey = key(neighbor);
      if (neighborKey !== targetKey && neighborKey !== startKey
        && isBlocked(neighbor, world, world.obstacles, obstaclePositions, clearance)) continue;
      if (direction.x && direction.y) {
        const horizontal = { x: current.x + direction.x, y: current.y };
        const vertical = { x: current.x, y: current.y + direction.y };
        if (isBlocked(horizontal, world, world.obstacles, obstaclePositions, clearance)
          || isBlocked(vertical, world, world.obstacles, obstaclePositions, clearance)) continue;
      }
      const tentative = (gScore.get(currentKey) ?? Infinity) + direction.cost;
      if (tentative >= (gScore.get(neighborKey) ?? Infinity)) continue;
      cameFrom.set(neighborKey, currentKey);
      cells.set(neighborKey, neighbor);
      gScore.set(neighborKey, tentative);
      fScore.set(neighborKey, tentative + distance(neighbor, targetCell));
      open.set(neighborKey, neighbor);
    }
  }

  // A blocked destination should never make the game unresponsive. Matter.js
  // still enforces collisions while the character attempts the direct route.
  return { ...intent, waypoints: [{ ...intent.target }] };
}

export function inputToward(from: ExperienceVector, to: ExperienceVector, deadZone = 14): ExperienceInputState {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    up: dy < -deadZone,
    down: dy > deadZone,
    left: dx < -deadZone,
    right: dx > deadZone
  };
}

export function screenPointToWorld(
  client: ExperienceVector,
  bounds: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  world: Pick<ExperienceWorld, 'width' | 'height'>
): ExperienceVector {
  return {
    x: Math.max(0, Math.min(world.width, ((client.x - bounds.left) / bounds.width) * world.width)),
    y: Math.max(0, Math.min(world.height, ((client.y - bounds.top) / bounds.height) * world.height))
  };
}
