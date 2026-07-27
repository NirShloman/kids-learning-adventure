import { describe, expect, it } from 'vitest';
import { ExperiencePhysicsController, FIXED_STEP_MS } from '../../src/components/games/experience/experiencePhysics';
import { getPhysicsTuning, gridPointToWorld } from '../../src/content/experienceWorlds';
import type { Age, Difficulty, ExperienceInputState, ExperienceWorld } from '../../src/types';

const emptyInput: ExperienceInputState = { up: false, down: false, left: false, right: false };
const rightInput: ExperienceInputState = { ...emptyInput, right: true };
const world: ExperienceWorld = { width: 1000, height: 620, seed: 1, obstacles: [] };

describe('experience physics', () => {
  it('provides age-safe tuning for all 12 age and difficulty combinations', () => {
    for (const age of [3, 4, 5, 6] as Age[]) {
      for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
        const tuning = getPhysicsTuning(age, difficulty);
        expect(tuning.maxSpeed).toBeGreaterThan(0);
        expect(tuning.playerRadius).toBeGreaterThanOrEqual(35);
        expect(tuning.interactionRadius).toBeGreaterThan(tuning.playerRadius);
        expect(tuning.snapRadius).toBeGreaterThanOrEqual(tuning.interactionRadius);
      }
    }
    expect(getPhysicsTuning(3, 'hard').interactionRadius).toBeGreaterThan(getPhysicsTuning(6, 'easy').interactionRadius);
  });

  it('accelerates continuously, then brakes to a stop', () => {
    const controller = new ExperiencePhysicsController(world, { x: 200, y: 300 }, getPhysicsTuning(4, 'medium'));
    let moving = controller.snapshot();
    for (let index = 0; index < 60; index += 1) moving = controller.step(rightInput, FIXED_STEP_MS);
    expect(moving.position.x).toBeGreaterThan(250);
    expect(moving.speed).toBeGreaterThan(80);
    let stopped = moving;
    for (let index = 0; index < 60; index += 1) stopped = controller.step(emptyInput, FIXED_STEP_MS);
    expect(stopped.speed).toBeLessThan(0.1);
    controller.destroy();
  });

  it('freezes motion immediately while success input is locked', () => {
    const controller = new ExperiencePhysicsController(world, { x: 200, y: 300 }, getPhysicsTuning(4, 'medium'));
    for (let index = 0; index < 30; index += 1) controller.step(rightInput, FIXED_STEP_MS);
    expect(controller.snapshot().speed).toBeGreaterThan(0);
    controller.stopMotion();
    const stoppedAt = controller.snapshot().position;
    for (let index = 0; index < 30; index += 1) controller.step(emptyInput, FIXED_STEP_MS);
    expect(controller.snapshot().speed).toBeLessThan(0.1);
    expect(controller.snapshot().position.x).toBeCloseTo(stoppedAt.x, 4);
    expect(controller.snapshot().position.y).toBeCloseTo(stoppedAt.y, 4);
    controller.destroy();
  });

  it('keeps the player inside world boundaries under sustained input', () => {
    const tuning = getPhysicsTuning(6, 'hard');
    const controller = new ExperiencePhysicsController(world, { x: 500, y: 310 }, tuning);
    let snapshot = controller.snapshot();
    for (let index = 0; index < 3000; index += 1) snapshot = controller.step(rightInput, FIXED_STEP_MS);
    expect(snapshot.position.x).toBeLessThanOrEqual(world.width - tuning.playerRadius + 0.5);
    expect(snapshot.position.x).toBeGreaterThanOrEqual(tuning.playerRadius - 0.5);
    expect(Number.isFinite(snapshot.position.x)).toBe(true);
    expect(Number.isFinite(snapshot.position.y)).toBe(true);
    controller.destroy();
  });

  it('collides with walls and advances moving bumpers deterministically', () => {
    const obstacleWorld: ExperienceWorld = {
      ...world,
      obstacles: [
        { id: 'wall', kind: 'wall', position: { x: 500, y: 310 }, width: 40, height: 300 },
        { id: 'bumper', kind: 'bumper', position: { x: 700, y: 310 }, width: 42, height: 42, axis: 'y', travel: 60, speed: 0.001 }
      ]
    };
    const controller = new ExperiencePhysicsController(obstacleWorld, { x: 350, y: 310 }, getPhysicsTuning(5, 'hard'));
    let snapshot = controller.snapshot();
    for (let index = 0; index < 240; index += 1) snapshot = controller.step(rightInput, FIXED_STEP_MS);
    expect(snapshot.position.x).toBeLessThan(480);
    expect(snapshot.obstaclePositions.bumper.y).not.toBe(310);
    controller.destroy();
  });

  it('attaches and releases a carried body with a stable constraint', () => {
    const controller = new ExperiencePhysicsController(world, { x: 300, y: 300 }, getPhysicsTuning(3, 'easy'));
    controller.attachCarriedBody(16);
    let snapshot = controller.snapshot();
    for (let index = 0; index < 180; index += 1) snapshot = controller.step(rightInput, FIXED_STEP_MS);
    expect(snapshot.carriedPosition).toBeDefined();
    expect(Math.hypot(
      snapshot.carriedPosition!.x - snapshot.position.x,
      snapshot.carriedPosition!.y - snapshot.position.y
    )).toBeLessThan(110);
    controller.releaseCarriedBody();
    expect(controller.snapshot().carriedPosition).toBeUndefined();
    controller.destroy();
  });

  it('maps legacy level points into stable continuous world coordinates', () => {
    expect(gridPointToWorld({ x: 0, y: 0 }, 5)).toEqual({ x: 105, y: 80 });
    expect(gridPointToWorld({ x: 4, y: 4 }, 5)).toEqual({ x: 895, y: 540 });
  });
});
