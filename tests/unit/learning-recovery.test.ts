// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { getLearningSnapshot } from '../../src/services/learningStoreService';

beforeEach(() => localStorage.clear());
describe('corrupt snapshot preservation', () => {
  it('never overwrites an unreadable primary snapshot with an empty profile', () => {
    localStorage.setItem('lomdim-bekef.learning.v4', '{broken');
    expect(() => getLearningSnapshot()).toThrow();
    expect(localStorage.getItem('lomdim-bekef.learning.v4')).toBe('{broken');
  });
  it('preserves an unsupported schema instead of migrating over it', () => {
    const future = JSON.stringify({ schemaVersion: 5, profiles: [{ id: 'child' }] });
    localStorage.setItem('lomdim-bekef.learning.v4', future);
    expect(() => getLearningSnapshot()).toThrow('unreadable');
    expect(localStorage.getItem('lomdim-bekef.learning.v4')).toBe(future);
  });
});
