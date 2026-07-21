import { ContentEnvelope, ContentItemBase, GameId } from '../types';

type ContentModule = { default: unknown };

const loaders: Record<GameId, () => Promise<ContentModule>> = {
  letters: () => import('../content/letters.json'),
  numbers: () => import('../content/numbers.json'),
  shapes: () => import('../content/shapes.json'),
  colors: () => import('../content/colors.json'),
  matching: () => import('../content/matching.json'),
  memory: () => import('../content/memory.json'),
  patterns: () => import('../content/patterns.json'),
  sorting: () => import('../content/sorting.json')
};

const contentCache = new Map<GameId, ContentEnvelope<ContentItemBase>>();

function isContentEnvelope(value: unknown, gameId: GameId): value is ContentEnvelope<ContentItemBase> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ContentEnvelope<ContentItemBase>>;
  return candidate.schemaVersion === 1 && candidate.gameId === gameId && Array.isArray(candidate.items);
}

export async function loadGameContent<T extends ContentItemBase>(gameId: GameId): Promise<ContentEnvelope<T>> {
  const cached = contentCache.get(gameId);
  if (cached) return cached as ContentEnvelope<T>;

  const module = await loaders[gameId]();
  if (!isContentEnvelope(module.default, gameId)) {
    throw new Error(`Invalid static content envelope for ${gameId}.`);
  }

  contentCache.set(gameId, module.default);
  return module.default as ContentEnvelope<T>;
}

export function clearStaticContentCache(): void {
  contentCache.clear();
}
