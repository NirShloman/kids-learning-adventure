import type { ContentItemBase, EvidenceForm, GameId } from '../types';
import { evidenceFormForGame, skillIdsForLegacySkill } from '../learning/skillGraph';
import { getActiveProfile, recordLearningEvent } from './learningStoreService';

export function recordActiveAttempt(item: ContentItemBase, gameId: GameId, correct: boolean, options: { evidenceForm?: EvidenceForm; attemptNumber?: number; hintUsed?: boolean; sessionId?: string; responseMs?: number | null } = {}): void {
  const profile = getActiveProfile(); if (!profile) return;
  recordLearningEvent({ profileId: profile.id, sessionId: options.sessionId ?? `manual-${gameId}`,
    contentId: item.id.replace(/-[ab]$/, ''), skillIds: item.skillIds ?? skillIdsForLegacySkill(item.skill), gameId,
    evidenceForm: options.evidenceForm ?? item.evidenceForm ?? evidenceFormForGame(gameId, item.skill),
    correct, attemptNumber: options.attemptNumber ?? 1, hintUsed: options.hintUsed ?? false,
    responseMs: options.responseMs ?? null, monotonicMs: Math.round(performance.now()) });
}
