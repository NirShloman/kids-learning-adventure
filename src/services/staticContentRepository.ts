import { ContentEnvelope, ContentItemBase, GameId } from '../types';
import type { LearningContentDescriptor } from '../types';
import { evidenceFormForGame, skillIdsForLegacySkill } from '../learning/skillGraph';

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

  const source = module.default;
  const enriched: ContentEnvelope<ContentItemBase> = {
    ...source,
    items: source.items.map((item) => ({
      ...item,
      skillIds: item.skillIds?.length ? item.skillIds : skillIdsForLegacySkill(item.skill),
      evidenceForm: item.evidenceForm ?? evidenceFormForGame(gameId, item.skill)
    }))
  };
  contentCache.set(gameId, enriched);
  return enriched as ContentEnvelope<T>;
}

export async function loadLearningContentIndex(): Promise<LearningContentDescriptor[]> {
  const gameIds: GameId[] = ['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting'];
  const envelopes = await Promise.all(gameIds.map((gameId) => loadGameContent(gameId)));
  return envelopes.flatMap((envelope) => envelope.items.map((item) => ({
    id: item.id, gameId: envelope.gameId, ages: item.ages, difficulty: item.difficulty,
    skillIds: item.skillIds ?? skillIdsForLegacySkill(item.skill),
    evidenceForm: item.evidenceForm ?? evidenceFormForGame(envelope.gameId, item.skill)
  })));
}

export function clearStaticContentCache(): void {
  contentCache.clear();
}
