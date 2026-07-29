import { describe, expect, it } from 'vitest';
import levels from '../../src/content/experiences.json';
import { selectExperienceLevels } from '../../src/content/experienceWorlds';
import type { Age, Difficulty, ExperienceGameId, ExperienceLevel } from '../../src/types';

const typedLevels = levels as unknown as ExperienceLevel[];

describe('experiential game content', () => {
  it('provides playable content for every former quiz-only game', () => {
    for (const gameId of ['letters', 'numbers', 'shapes', 'colors']) {
      expect(levels.some((level) => level.gameId === gameId)).toBe(true);
    }
  });

  it('keeps entities inside their grids and provides enough objectives', () => {
    for (const level of levels) {
      expect(level.required).toBeGreaterThan(0);
      expect(level.entities.filter((entity) => entity.kind === 'collectible' || entity.kind === 'target').length).toBeGreaterThanOrEqual(level.required);
      for (const entity of level.entities) {
        expect(entity.x).toBeGreaterThanOrEqual(0);
        expect(entity.y).toBeGreaterThanOrEqual(0);
        expect(entity.x).toBeLessThan(level.gridSize);
        expect(entity.y).toBeLessThan(level.gridSize);
        expect('emoji' in entity).toBe(false);
        expect(Boolean(entity.visual?.assetId || entity.fallbackGlyph)).toBe(true);
      }
    }
  });

  it('covers ages 3-6 and easy, medium, and hard for every experiential game', () => {
    for (const gameId of ['letters', 'numbers', 'shapes', 'colors']) {
      for (const age of [3, 4, 5, 6]) {
        for (const difficulty of ['easy', 'medium', 'hard']) {
          expect(levels.some((level) =>
            level.gameId === gameId
            && level.ages.includes(age)
            && level.difficulty.includes(difficulty)
          )).toBe(true);
        }
      }
    }
  });

  it('selects one age-safe task with difficulty-appropriate item counts for all combinations', () => {
    for (const gameId of ['letters', 'numbers', 'shapes', 'colors'] as ExperienceGameId[]) {
      for (const age of [3, 4, 5, 6] as Age[]) {
        for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
          const selected = selectExperienceLevels(typedLevels, gameId, age, difficulty);
          expect(selected).toHaveLength(1);
          expect(selected[0].ages).toContain(age);
          if (age === 3 || difficulty === 'easy') expect(selected[0].required).toBe(3);
          if (age >= 5 && difficulty === 'medium') expect(selected[0].required).toBe(4);
          if (age >= 5 && difficulty === 'hard') expect(selected[0].required).toBe(5);
          expect(selected[0].required).toBeLessThanOrEqual(age === 3 ? 3 : 5);
        }
      }
    }
  });
});
