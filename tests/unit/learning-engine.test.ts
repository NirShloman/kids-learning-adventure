import { describe, expect, it } from 'vitest';
import type { LearnerProfile, LearningContentDescriptor, LearningEvent, ProfileLearningData, SkillMastery } from '../../src/types';
import { applyLearningEvent, effectiveNow, emptyMastery } from '../../src/learning/masteryEngine';
import { planAdaptiveSession } from '../../src/learning/sessionPlanner';
import { skillGraph, validateSkillGraph } from '../../src/learning/skillGraph';
import { createDefaultProfile } from '../../src/services/learningStoreService';

function event(overrides: Partial<LearningEvent> = {}): LearningEvent {
  return { id: 'event', profileId: 'profile', sessionId: 'session', contentId: 'item',
    skillIds: ['cognition.sequence'], gameId: 'patterns', evidenceForm: 'sequence', correct: true,
    attemptNumber: 1, hintUsed: false, responseMs: 120_000, monotonicMs: 1,
    occurredAt: '2026-08-01T10:00:00.000Z', effectiveDay: '2026-08-01', ...overrides };
}

function data(overrides: Partial<ProfileLearningData> = {}): ProfileLearningData {
  return { mastery: {}, events: [], sessions: [], recentContent: {}, activePlan: null,
    journey: { unlockedWorlds: ['letters'], completedLevelIds: [], decorationIds: [] },
    lastEffectiveNow: '2026-08-01T10:00:00.000Z', dailyContentCounts: {}, ...overrides };
}

describe('skill graph and mastery', () => {
  it('contains the full acyclic local skill graph', () => {
    expect(skillGraph).toHaveLength(17);
    expect(validateSkillGraph()).toEqual([]);
    expect(skillGraph.some((skill) => skill.name.includes('צליל פותח וסוגר'))).toBe(true);
    expect(skillGraph.some((skill) => skill.name.includes('מוכנות לכיתה'))).toBe(true);
  });

  it('never penalizes a slow correct response and gives less credit after a hint', () => {
    const slow = applyLearningEvent(emptyMastery('cognition.sequence'), event({ responseMs: 600_000 }), {}, new Date('2026-08-01T10:00:00Z'));
    const fast = applyLearningEvent(emptyMastery('cognition.sequence'), event({ responseMs: 400 }), {}, new Date('2026-08-01T10:00:00Z'));
    const hinted = applyLearningEvent(emptyMastery('cognition.sequence'), event({ hintUsed: true }), {}, new Date('2026-08-01T10:00:00Z'));
    expect(slow.confidence).toBe(fast.confidence);
    expect(hinted.confidence).toBeLessThan(fast.confidence);
  });

  it('uses two evidence forms, recent consistency and prerequisites before mastery', () => {
    const prerequisites: Partial<Record<'foundation.visual-discrimination', SkillMastery>> = {
      'foundation.visual-discrimination': { ...emptyMastery('foundation.visual-discrimination'), status: 'mastered', confidence: 90 }
    };
    let mastery = emptyMastery('cognition.sequence');
    for (let index = 0; index < 7; index += 1) mastery = applyLearningEvent(mastery,
      event({ id: `event-${index}`, evidenceForm: index === 0 ? 'shared-cooperation' : 'sequence' }), prerequisites,
      new Date(`2026-08-0${index + 1}T10:00:00Z`));
    expect(mastery.status).toBe('mastered');
    mastery = applyLearningEvent(mastery, event({ correct: false }), prerequisites, new Date('2026-08-09T10:00:00Z'));
    mastery = applyLearningEvent(mastery, event({ correct: false }), prerequisites, new Date('2026-08-09T10:01:00Z'));
    expect(mastery.status).toBe('needs-reinforcement');
  });

  it('clamps backward clock changes and long absences', () => {
    const previous = '2026-08-01T10:00:00.000Z';
    expect(effectiveNow(new Date('2026-07-01'), previous).toISOString()).toBe(previous);
    expect(effectiveNow(new Date('2027-08-01'), previous).toISOString()).toBe('2026-10-30T10:00:00.000Z');
  });
});

describe('adaptive session planner', () => {
  it('creates a deterministic 5–7 minute mixed plan without immediate repetition', () => {
    const profile: LearnerProfile = createDefaultProfile({ id: 'profile', age: 5 });
    const gameIds = ['letters', 'numbers', 'shapes', 'colors', 'matching', 'patterns'] as const;
    const content: LearningContentDescriptor[] = Array.from({ length: 24 }, (_, index) => ({
      id: `item-${index}`, gameId: gameIds[index % gameIds.length], ages: [5],
      difficulty: index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard',
      skillIds: index % 2 ? ['foundation.visual-discrimination'] : ['hebrew.letter-recognition'],
      evidenceForm: 'visual-choice'
    }));
    const first = planAdaptiveSession(profile, data(), content, new Date('2026-08-02T10:00:00Z'), 'seed');
    const second = planAdaptiveSession(profile, data(), content, new Date('2026-08-02T10:00:00Z'), 'seed');
    expect(first).toEqual(second);
    expect(first.tasks).toHaveLength(6);
    expect(first.estimatedMinutes).toBeGreaterThanOrEqual(5);
    expect(first.estimatedMinutes).toBeLessThanOrEqual(7);
    expect(new Set(first.tasks.map((task) => task.contentId)).size).toBe(first.tasks.length);
    expect(first.tasks.every((task, index) => index === 0 || task.contentId !== first.tasks[index - 1].contentId)).toBe(true);
  });

  it('respects the two-uses-per-day cap', () => {
    const profile = createDefaultProfile({ id: 'profile', age: 4 });
    const content: LearningContentDescriptor[] = Array.from({ length: 12 }, (_, index) => ({ id: `item-${index}`, gameId: index % 2 ? 'letters' : 'numbers', ages: [4], difficulty: 'easy', skillIds: ['foundation.visual-discrimination'], evidenceForm: 'visual-choice' }));
    const plan = planAdaptiveSession(profile, data({ dailyContentCounts: { '2026-08-02:item-0': 2 } }), content, new Date('2026-08-02T10:00:00Z'), 'seed');
    expect(plan.tasks.some((task) => task.contentId === 'item-0')).toBe(false);
  });
});
