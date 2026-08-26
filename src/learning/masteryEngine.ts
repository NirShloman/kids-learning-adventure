import type { LearningEvent, SkillId, SkillMastery } from '../types';
import { getSkillDefinition } from './skillGraph';

const intervals = [0, 1, 3, 7, 14, 30] as const;
const DAY_MS = 86_400_000;

export function emptyMastery(skillId: SkillId): SkillMastery {
  return {
    skillId,
    status: 'new',
    confidence: 0,
    evidenceCount: 0,
    correctCount: 0,
    recentOutcomes: [],
    evidenceForms: [],
    intervalStep: 0,
    dueAt: null,
    lastPracticedAt: null,
    lastContentId: null
  };
}

export function effectiveNow(deviceNow: Date, lastEffectiveNow?: string): Date {
  if (!lastEffectiveNow) return deviceNow;
  const previous = new Date(lastEffectiveNow);
  if (Number.isNaN(previous.getTime())) return deviceNow;
  if (deviceNow < previous) return previous;
  const maximum = new Date(previous.getTime() + 90 * DAY_MS);
  return deviceNow > maximum ? maximum : deviceNow;
}

function statusFor(next: SkillMastery, prerequisitesMastered: boolean, now: Date): SkillMastery['status'] {
  const lastThree = next.recentOutcomes.slice(-3);
  const repeatedErrors = lastThree.length >= 2 && lastThree.filter((outcome) => !outcome).length >= 2;
  const overdue = next.dueAt !== null && now.getTime() - new Date(next.dueAt).getTime() > getSkillDefinition(next.skillId).reinforcementAfterDays * DAY_MS;
  if ((next.status === 'mastered' || next.confidence >= 80) && (repeatedErrors || overdue)) return 'needs-reinforcement';
  if (!next.evidenceCount) return 'new';
  if (next.confidence < 25) return 'exposed';
  if (next.confidence < 60) return 'practicing';
  const lastFive = next.recentOutcomes.slice(-5);
  const strongRecentEvidence = lastFive.length === 5 && lastFive.filter(Boolean).length >= 4;
  if (next.confidence >= getSkillDefinition(next.skillId).masteryThreshold && strongRecentEvidence && next.evidenceForms.length >= 2 && prerequisitesMastered && getSkillDefinition(next.skillId).evidenceLimit !== 'partial') return 'mastered';
  return 'almost-mastered';
}

export function applyLearningEvent(
  current: SkillMastery | undefined,
  event: LearningEvent,
  masteryBySkill: Partial<Record<SkillId, SkillMastery>>,
  now = new Date(event.occurredAt)
): SkillMastery {
  const base = current ?? emptyMastery(event.skillIds[0]);
  const change = event.correct
    ? event.hintUsed || event.attemptNumber > 1 ? 5 : 12
    : -10;
  const isNewForm = !base.evidenceForms.includes(event.evidenceForm);
  const confidence = Math.max(0, Math.min(100, base.confidence + change + (event.correct && isNewForm ? 4 : 0)));
  const intervalStep = event.correct
    ? Math.min(intervals.length - 1, base.intervalStep + 1)
    : 0;
  const dueAt = event.correct
    ? new Date(now.getTime() + intervals[intervalStep] * DAY_MS).toISOString()
    : now.toISOString();
  const next: SkillMastery = {
    ...base,
    confidence,
    evidenceCount: base.evidenceCount + 1,
    correctCount: base.correctCount + (event.correct ? 1 : 0),
    recentOutcomes: [...base.recentOutcomes, event.correct].slice(-8),
    evidenceForms: [...new Set([...base.evidenceForms, event.evidenceForm])],
    intervalStep,
    dueAt,
    lastPracticedAt: now.toISOString(),
    lastContentId: event.contentId
  };
  const prerequisitesMastered = getSkillDefinition(next.skillId).prerequisites.every((id) => masteryBySkill[id]?.status === 'mastered');
  return { ...next, status: statusFor(next, prerequisitesMastered, now) };
}

export function refreshMasteryForTime(mastery: SkillMastery, now: Date): SkillMastery {
  return { ...mastery, status: statusFor(mastery, true, now) };
}

export function consecutiveErrors(events: LearningEvent[]): number {
  let count = 0;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index].correct) break;
    count += 1;
  }
  return count;
}
