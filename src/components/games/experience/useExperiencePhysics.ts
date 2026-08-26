import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Age, Difficulty, ExperienceInputState, ExperienceLevel } from '../../../types';
import { getPhysicsTuning, resolveExperienceWorld, resolvePlayerStart } from '../../../content/experienceWorlds';
import { ExperiencePhysicsController, type ExperiencePhysicsSnapshot } from './experiencePhysics';

const EMPTY_SNAPSHOT: ExperiencePhysicsSnapshot = {
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  speed: 0,
  tick: 0,
  obstaclePositions: {},
  carriedPosition: undefined
};

export function useExperiencePhysics(
  level: ExperienceLevel | undefined,
  age: Age,
  difficulty: Difficulty,
  inputRef: RefObject<ExperienceInputState>
) {
  const controllerRef = useRef<ExperiencePhysicsController | null>(null);
  const [snapshot, setSnapshot] = useState<ExperiencePhysicsSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (!level) return;
    const controller = new ExperiencePhysicsController(
      resolveExperienceWorld(level, difficulty),
      resolvePlayerStart(level),
      getPhysicsTuning(age, difficulty)
    );
    controllerRef.current = controller;
    setSnapshot(controller.snapshot());
    let frame = 0;
    let previous = performance.now();
    let isActive = !document.hidden;
    const onVisibility = () => { isActive = !document.hidden; previous = performance.now(); };
    const onAppState = (event: Event) => {
      isActive = (event as CustomEvent<{ isActive: boolean }>).detail.isActive;
      previous = performance.now();
      if (!isActive) controller.stopMotion();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('lomdim:app-state', onAppState);
    const animate = (now: number) => {
      const next = isActive
        ? controller.step(inputRef.current ?? undefined, now - previous)
        : controller.snapshot();
      previous = now;
      if (isActive) setSnapshot(next);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('lomdim:app-state', onAppState);
      controller.destroy();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [age, difficulty, inputRef, level]);

  const attachCarriedBody = useCallback((radius?: number) => controllerRef.current?.attachCarriedBody(radius), []);
  const releaseCarriedBody = useCallback(() => controllerRef.current?.releaseCarriedBody(), []);
  const stopMotion = useCallback(() => controllerRef.current?.stopMotion(), []);

  return { snapshot, attachCarriedBody, releaseCarriedBody, stopMotion };
}
