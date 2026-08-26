import { describe, expect, it } from 'vitest';
import { findNavigationPath, inputToward, screenPointToWorld } from '../../src/components/games/experience/experienceNavigation';
import type { ExperienceWorld } from '../../src/types';

const world: ExperienceWorld = {
  width: 1000,
  height: 620,
  seed: 1,
  obstacles: [{ id: 'wall', kind: 'wall', position: { x: 500, y: 310 }, width: 180, height: 80 }]
};

describe('direct-touch navigation', () => {
  it('maps screen touches into clamped world coordinates', () => {
    expect(screenPointToWorld({ x: 550, y: 330 }, { left: 50, top: 20, width: 1000, height: 620 }, world)).toEqual({ x: 500, y: 310 });
    expect(screenPointToWorld({ x: -10, y: 900 }, { left: 0, top: 0, width: 1000, height: 620 }, world)).toEqual({ x: 0, y: 620 });
  });

  it('routes around an inflated obstacle', () => {
    const path = findNavigationPath({ x: 160, y: 310 }, { target: { x: 840, y: 310 }, interactEntityId: 'target' }, world, {}, 40);
    expect(path.interactEntityId).toBe('target');
    expect(path.waypoints.length).toBeGreaterThan(2);
    expect(path.waypoints.some((point) => Math.abs(point.y - 310) > 90)).toBe(true);
    expect(path.waypoints[path.waypoints.length - 1]).toEqual({ x: 840, y: 310 });
  });

  it('produces keyboard-compatible directional input', () => {
    expect(inputToward({ x: 100, y: 100 }, { x: 180, y: 40 })).toEqual({ up: true, down: false, left: false, right: true });
    expect(inputToward({ x: 100, y: 100 }, { x: 105, y: 106 })).toEqual({ up: false, down: false, left: false, right: false });
  });
});
