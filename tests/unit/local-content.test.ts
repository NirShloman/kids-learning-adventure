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
import { getMatchingPairs, getMemoryCards, getPatternPuzzles, getQuizQuestions, getSortingChallenges } from '../../src/services/questionService';
import { clearStaticContentCache } from '../../src/services/staticContentRepository';
import { getLocalLearnerState, resetLocalLearnerData } from '../../src/services/learnerProgressService';
import { getMotionInputName } from '../../src/components/motion/motion.types';
import { musicTracks } from '../../src/assets/audioManifest';
import { getLocalDataStore } from '../../src/services/localDataStore';
import { createProfile } from '../../src/services/learningStoreService';

const banks = { letters, numbers, shapes, colors, matching, memory, patterns, sorting };
const expectedCounts = { letters: 480, numbers: 480, shapes: 480, colors: 480, matching: 480, memory: 480, patterns: 480, sorting: 480 };

beforeEach(() => {
  window.localStorage.clear();
  clearStaticContentCache();
});

describe('static content bank', () => {
  it('contains 3,840 uniquely AI-reviewed, age-and-level classified items', () => {
    const allItems = Object.values(banks).flatMap((bank) => bank.items);
    expect(allItems).toHaveLength(3840);
    expect(new Set(allItems.map((item) => item.id)).size).toBe(3840);
    expect(Object.keys(reviewStatus.reviews)).toHaveLength(3840);

    for (const [gameId, bank] of Object.entries(banks)) {
      expect(bank.schemaVersion).toBe(2);
      expect(bank.gameId).toBe(gameId);
      expect(bank.items).toHaveLength(expectedCounts[gameId as keyof typeof expectedCounts]);
      for (const item of bank.items) {
        expect(item.ages).toHaveLength(1);
        expect(item.taskFamily).toBeTruthy();
        expect(item.conceptKey).toBeTruthy();
        expect(item.variantKey).toBeTruthy();
        expect(reviewStatus.reviews[item.id as keyof typeof reviewStatus.reviews]).toMatchObject({ status: 'ai-reviewed', reviewerType: 'ai-simulation', linguistic: 'approved', conceptual: 'approved', ageFit: 'approved' });
      }
    }
  });

  it('provides exactly 40 items for every game, age, and difficulty', () => {
    for (const bank of Object.values(banks)) {
      for (const age of [3, 4, 5, 6]) {
        for (const difficulty of ['easy', 'medium', 'hard']) {
          expect(bank.items.filter((item) => item.ages.includes(age) && item.difficulty === difficulty)).toHaveLength(40);
        }
      }
    }
  });
});

describe('selection and local migration', () => {
  it('exposes asynchronous storage operations while preserving the initialized cache', async () => {
    const store = getLocalDataStore();
    await store.set('test-key', 'test-value');
    expect(store.getCached('test-key')).toBe('test-value');
    expect(await store.get('test-key')).toBe('test-value');
    await store.remove('test-key');
    expect(await store.get('test-key')).toBeNull();
  });

  it('does not repeat quiz items from the immediately previous session', async () => {
    createProfile({ age: 4 });
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

  it('selects only the requested age and difficulty across every game', async () => {
    const difficulty = 'hard' as const;
    for (const age of [3, 4, 5, 6] as const) {
      const [letters, numbers, shapes, colors, matchingPairs, cards, patterns, sorting] = await Promise.all([
        getQuizQuestions('letters', age, difficulty), getQuizQuestions('numbers', age, difficulty), getQuizQuestions('shapes', age, difficulty), getQuizQuestions('colors', age, difficulty),
        getMatchingPairs(age, difficulty), getMemoryCards(age, difficulty), getPatternPuzzles(age, difficulty), getSortingChallenges(age, difficulty)
      ]);
      for (const item of [...letters, ...numbers, ...shapes, ...colors, ...matchingPairs, ...cards, ...patterns, ...sorting]) {
        expect(item.ages).toEqual([age]);
        expect(item.difficulty).toBe(difficulty);
      }
    }
  });

  it('migrates the first legacy learner without deleting legacy keys', () => {
    const legacyPlayers = [{ id: 'first', age: 6, difficulty: 'hard', voiceEnabled: false }, { id: 'second', age: 3 }];
    window.localStorage.setItem('kids-learning-adventure.players', JSON.stringify(legacyPlayers));
    const learner = getLocalLearnerState();
    expect(learner).toMatchObject({ age: 6, difficulty: 'hard', voiceEnabled: false });
    expect(window.localStorage.getItem('kids-learning-adventure.players')).toBe(JSON.stringify(legacyPlayers));
  });

  it('migrates schema 2 audio settings and enables music by default', () => {
    window.localStorage.setItem('lomdim-bekef.learner.v1', JSON.stringify({
      schemaVersion: 2,
      name: 'נועה',
      gender: 'girl',
      profileCompleted: true,
      age: 5,
      difficulty: 'medium',
      voiceEnabled: false,
      narrationEnabled: false,
      soundEffectsEnabled: false,
      migratedFromLegacy: false,
      updatedAt: '2026-01-01T00:00:00.000Z'
    }));

    expect(getLocalLearnerState()).toMatchObject({
      schemaVersion: 3,
      narrationEnabled: false,
      voiceEnabled: false,
      soundEffectsEnabled: false,
      musicEnabled: true
    });
  });

  it('repairs missing schema 3 audio flags with safe defaults', () => {
    window.localStorage.setItem('lomdim-bekef.learner.v1', JSON.stringify({
      schemaVersion: 3,
      name: '',
      gender: null,
      profileCompleted: false,
      age: 4,
      difficulty: 'medium'
    }));
    expect(getLocalLearnerState()).toMatchObject({
      narrationEnabled: true,
      voiceEnabled: true,
      soundEffectsEnabled: true,
      musicEnabled: true
    });
  });

  it('deletes all locally stored learner, progress, history, and recent-content data', async () => {
    const store = getLocalDataStore();
    await store.set('lomdim-bekef.learner.v1', '{"name":"נועה"}');
    await store.set('lomdim-bekef.sessions.v1', '[{"score":8}]');
    await store.set('lomdim-bekef.recent-content.v1', '{"letters":["a1"]}');
    await store.set('unrelated-origin-key', 'must not be removed by the app reset');

    await resetLocalLearnerData();

    expect(window.localStorage.getItem('lomdim-bekef.learner.v1')).toBeNull();
    expect(window.localStorage.getItem('lomdim-bekef.sessions.v1')).toBeNull();
    expect(window.localStorage.getItem('lomdim-bekef.recent-content.v1')).toBeNull();
    expect(window.localStorage.getItem('unrelated-origin-key')).toBe('must not be removed by the app reset');
  });
});

describe('approved music mapping', () => {
  it('maps each playable world to an instrumental track', () => {
    expect(musicTracks.letters).toBe('music/garden-gate');
    expect(musicTracks.shapes).toBe('music/polygons-at-play');
    expect(musicTracks.colors).toBe('music/painted-garden-gate');
    expect(musicTracks.home).toBe('music/garden-gate');
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
