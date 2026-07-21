// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import letters from '../../src/content/letters.json';
import numbers from '../../src/content/numbers.json';
import shapes from '../../src/content/shapes.json';
import colors from '../../src/content/colors.json';
import matching from '../../src/content/matching.json';
import memory from '../../src/content/memory.json';
import patterns from '../../src/content/patterns.json';
import sorting from '../../src/content/sorting.json';
import reviewStatus from '../../src/content/review-status.json';
import { getMemoryCards, getQuizQuestions } from '../../src/services/questionService';
import { clearStaticContentCache } from '../../src/services/staticContentRepository';
import { getLocalLearnerState } from '../../src/services/learnerProgressService';
import { getMotionInputName } from '../../src/components/motion/motion.types';

const banks = { letters, numbers, shapes, colors, matching, memory, patterns, sorting };
const expectedCounts = { letters: 180, numbers: 170, shapes: 110, colors: 110, matching: 120, memory: 100, patterns: 110, sorting: 110 };

beforeEach(() => {
  window.localStorage.clear();
  clearStaticContentCache();
});

describe('static content bank', () => {
  it('contains 1,010 uniquely reviewed items in versioned envelopes', () => {
    const allItems = Object.values(banks).flatMap((bank) => bank.items);
    expect(allItems).toHaveLength(1010);
    expect(new Set(allItems.map((item) => item.id)).size).toBe(1010);
    expect(Object.keys(reviewStatus.reviews)).toHaveLength(1010);

    for (const [gameId, bank] of Object.entries(banks)) {
      expect(bank.schemaVersion).toBe(1);
      expect(bank.gameId).toBe(gameId);
      expect(bank.items).toHaveLength(expectedCounts[gameId as keyof typeof expectedCounts]);
      for (const item of bank.items) {
        expect(reviewStatus.reviews[item.id as keyof typeof reviewStatus.reviews]).toMatchObject({ linguistic: 'approved', conceptual: 'approved', ageFit: 'approved' });
      }
    }
  });

  it('provides at least 15 items for every game, age, and difficulty', () => {
    for (const bank of Object.values(banks)) {
      for (const age of [3, 4, 5, 6]) {
        for (const difficulty of ['easy', 'medium', 'hard']) {
          expect(bank.items.filter((item) => item.ages.includes(age) && item.difficulty === difficulty).length).toBeGreaterThanOrEqual(15);
        }
      }
    }
  });
});

describe('selection and local migration', () => {
  it('does not repeat quiz items from the immediately previous session', async () => {
    const first = await getQuizQuestions('letters', 4, 'medium');
    const second = await getQuizQuestions('letters', 4, 'medium');
    const firstIds = new Set(first.map((item) => item.id));
    expect(second.some((item) => firstIds.has(item.id))).toBe(false);
  });

  it('creates exactly two runtime cards for each selected memory pair', async () => {
    const cards = await getMemoryCards(5, 'hard');
    const counts = new Map<string, number>();
    cards.forEach((card) => counts.set(card.pairId, (counts.get(card.pairId) ?? 0) + 1));
    expect(cards).toHaveLength(12);
    expect([...counts.values()].every((count) => count === 2)).toBe(true);
  });

  it('migrates the first legacy learner without deleting legacy keys', () => {
    const legacyPlayers = [{ id: 'first', age: 6, difficulty: 'hard', voiceEnabled: false }, { id: 'second', age: 3 }];
    window.localStorage.setItem('kids-learning-adventure.players', JSON.stringify(legacyPlayers));
    const learner = getLocalLearnerState();
    expect(learner).toMatchObject({ age: 6, difficulty: 'hard', voiceEnabled: false, migratedFromLegacy: true });
    expect(window.localStorage.getItem('kids-learning-adventure.players')).toBe(JSON.stringify(legacyPlayers));
  });
});

describe('motion event mapping', () => {
  it('maps deterministic state-machine inputs', () => {
    expect(getMotionInputName('intro')).toBe('wave');
    expect(getMotionInputName('correct')).toBe('correct');
    expect(getMotionInputName('retry')).toBe('retry');
    expect(getMotionInputName('reveal')).toBe('reveal');
  });
});
