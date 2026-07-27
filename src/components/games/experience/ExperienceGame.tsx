import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import rawLevels from '../../../content/experiences.json';
import {
  getPhysicsTuning,
  resolveEntityPosition,
  resolveExperienceWorld,
  selectExperienceLevels
} from '../../../content/experienceWorlds';
import type {
  Age,
  CharacterAnimationState,
  Difficulty,
  ExperienceEntity,
  ExperienceGameId,
  ExperienceInputState,
  ExperienceLevel,
  FacingDirection,
  LearnerGender
} from '../../../types';
import { useSpeech } from '../../../hooks/useSpeech';
import { playAudioCue } from '../../../services/audioService';
import { AnimatedFeedback } from '../../common/AnimatedFeedback';
import { ProgressBar } from '../../common/ProgressBar';
import { GameImage } from '../../common/GameImage';
import { GameWorld } from '../GameWorld';
import { ExperienceCharacter } from './ExperienceCharacter';
import { ExperienceSprite } from './ExperienceSprite';
import { GameControls } from './GameControls';
import { useExperiencePhysics } from './useExperiencePhysics';

interface ExperienceGameProps {
  gameId: ExperienceGameId;
  title: string;
  age: Age;
  difficulty: Difficulty;
  gender: LearnerGender;
  learnerName: string;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

type DirectionCommand = 'up' | 'down' | 'left' | 'right';

const levels = rawLevels as ExperienceLevel[];
const EMPTY_INPUT: ExperienceInputState = { up: false, down: false, left: false, right: false };
const countWords = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];

function keyboardDirection(key: string): DirectionCommand | null {
  const normalized = key.toLowerCase();
  if (key === 'ArrowUp' || normalized === 'w') return 'up';
  if (key === 'ArrowDown' || normalized === 's') return 'down';
  if (key === 'ArrowLeft' || normalized === 'a') return 'left';
  if (key === 'ArrowRight' || normalized === 'd') return 'right';
  return null;
}

function distanceBetween(first: { x: number; y: number }, second: { x: number; y: number }) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function ExperienceGame({
  gameId,
  title,
  age,
  difficulty,
  gender,
  learnerName,
  voiceEnabled,
  onBack,
  onFinish
}: ExperienceGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const availableLevels = useMemo(
    () => selectExperienceLevels(levels, gameId, age, difficulty),
    [age, difficulty, gameId]
  );
  const [levelIndex, setLevelIndex] = useState(0);
  const [heldId, setHeldId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [facing, setFacing] = useState<FacingDirection>('front');
  const [actionAnimation, setActionAnimation] = useState<CharacterAnimationState | null>(null);
  const [arenaViewport, setArenaViewport] = useState({ width: 0, height: 0 });
  const inputRef = useRef<ExperienceInputState>({ ...EMPTY_INPUT });
  const arenaRef = useRef<HTMLDivElement>(null);
  const actionTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);
  const currentLevel = availableLevels[levelIndex];
  const tuning = getPhysicsTuning(age, difficulty);
  const world = currentLevel ? resolveExperienceWorld(currentLevel, difficulty) : null;
  const { snapshot, attachCarriedBody, releaseCarriedBody, stopMotion } = useExperiencePhysics(
    currentLevel,
    age,
    difficulty,
    inputRef
  );

  const entityPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    if (currentLevel) {
      for (const entity of currentLevel.entities) {
        positions.set(entity.id, resolveEntityPosition(currentLevel, entity));
      }
    }
    return positions;
  }, [currentLevel]);

  const clearInput = useCallback(() => {
    inputRef.current = { ...EMPTY_INPUT };
  }, []);

  const playActionAnimation = useCallback((animation: 'pickup' | 'drop') => {
    setActionAnimation(animation);
    if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
    actionTimerRef.current = window.setTimeout(() => {
      setActionAnimation(null);
      actionTimerRef.current = null;
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 430);
  }, []);

  useEffect(() => {
    arenaRef.current?.focus({ preventScroll: true });
  }, [levelIndex]);

  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setArenaViewport((previous) =>
        Math.abs(previous.width - width) < 0.5 && Math.abs(previous.height - height) < 0.5
          ? previous
          : { width, height }
      );
    });
    observer.observe(arena);
    return () => observer.disconnect();
  }, [currentLevel?.id]);

  useEffect(() => {
    if (!currentLevel) return;
    speak(`${currentLevel.title}. ${currentLevel.instruction}`);
    return stop;
  }, [currentLevel, speak, stop]);

  useEffect(() => {
    const onWindowBlur = () => clearInput();
    window.addEventListener('blur', onWindowBlur);
    return () => window.removeEventListener('blur', onWindowBlur);
  }, [clearInput]);

  useEffect(() => () => {
    clearInput();
    if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
    if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
  }, [clearInput]);

  useEffect(() => {
    if (snapshot.speed < 8) return;
    const { x, y } = snapshot.velocity;
    if (Math.abs(x) > Math.abs(y)) setFacing(x < 0 ? 'left' : 'right');
    else setFacing(y < 0 ? 'back' : 'front');
  }, [snapshot.speed, snapshot.velocity]);

  const resetForLevel = useCallback((nextIndex: number) => {
    if (!availableLevels[nextIndex]) return;
    clearInput();
    releaseCarriedBody();
    setHeldId(null);
    setRemovedIds([]);
    setCompletedIds([]);
    setProgress(0);
    setFeedback('');
    setIsCelebrating(false);
    setActionAnimation(null);
  }, [availableLevels, clearInput, releaseCarriedBody]);

  const finishLevel = useCallback((nextProgress: number) => {
    if (!currentLevel || nextProgress < currentLevel.required) return;
    clearInput();
    stopMotion();
    releaseCarriedBody();
    setIsCelebrating(true);
    setFeedback(currentLevel.successText);
    playAudioCue('match');
    speak(currentLevel.successText);
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 5000 : 1400;
    celebrationTimerRef.current = window.setTimeout(() => {
      if (levelIndex + 1 >= availableLevels.length) {
        onFinish(availableLevels.length, availableLevels.length, 3);
        return;
      }
      const nextIndex = levelIndex + 1;
      resetForLevel(nextIndex);
      setLevelIndex(nextIndex);
    }, delay);
  }, [
    availableLevels.length,
    clearInput,
    currentLevel,
    levelIndex,
    onFinish,
    releaseCarriedBody,
    resetForLevel,
    speak,
    stopMotion
  ]);

  const nearestInteractiveEntity = useMemo(() => {
    if (!currentLevel) return null;
    let nearest: ExperienceEntity | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const entity of currentLevel.entities) {
      if (removedIds.includes(entity.id) || completedIds.includes(entity.id)) continue;
      const position = entityPositions.get(entity.id);
      if (!position) continue;
      const distance = distanceBetween(snapshot.position, position);
      if (distance <= tuning.interactionRadius + (entity.radius ?? 24) && distance < nearestDistance) {
        nearest = entity;
        nearestDistance = distance;
      }
    }
    return nearest;
  }, [
    completedIds,
    currentLevel,
    entityPositions,
    removedIds,
    snapshot.position,
    tuning.interactionRadius
  ]);

  const interact = useCallback(() => {
    if (!currentLevel || isCelebrating) return;
    const entity = nearestInteractiveEntity;
    if (!entity) {
      setFeedback('התקרבו לפריט ולחצו על רווח או על כפתור הפעולה.');
      playAudioCue('retry');
      return;
    }

    if (gameId === 'colors') {
      if (entity.kind === 'station') {
        setHeldId(entity.id);
        attachCarriedBody(15);
        playActionAnimation('pickup');
        setFeedback(`המכחול נטען ב${entity.label}.`);
        playAudioCue('select');
        speak(entity.label);
        return;
      }
      if (entity.kind === 'target' && heldId === entity.accepts) {
        const next = progress + 1;
        setCompletedIds((previous) => [...previous, entity.id]);
        setProgress(next);
        setHeldId(null);
        releaseCarriedBody();
        playActionAnimation('drop');
        setFeedback('איזה יופי, הצבע מתאים!');
        playAudioCue('match');
        finishLevel(next);
        return;
      }
      setHeldId(null);
      releaseCarriedBody();
      playActionAnimation('drop');
      setFeedback('כמעט. טענו שוב את המכחול בצבע שמסומן ליד העצם.');
      playAudioCue('retry');
      speak('כמעט, נסו צבע אחר.');
      return;
    }

    if (entity.kind === 'collectible' && !heldId) {
      setHeldId(entity.id);
      setRemovedIds((previous) => [...previous, entity.id]);
      attachCarriedBody(entity.radius ?? 18);
      playActionAnimation('pickup');
      setFeedback(`אספתם ${entity.label}. עכשיו הביאו אותו ליעד.`);
      playAudioCue('select');
      speak(entity.label);
      return;
    }

    if (entity.kind === 'target' && heldId) {
      const held = currentLevel.entities.find((item) => item.id === heldId);
      const matches = gameId === 'letters' || gameId === 'numbers' || held?.accepts === entity.accepts;
      if (matches) {
        const next = progress + 1;
        setProgress(next);
        setHeldId(null);
        releaseCarriedBody();
        playActionAnimation('drop');
        if (gameId === 'shapes') setCompletedIds((previous) => [...previous, entity.id]);
        const message = gameId === 'numbers'
          ? `${countWords[next] ?? next}!`
          : `מצוין, ${held?.label ?? 'החלק'} במקום!`;
        setFeedback(message);
        playAudioCue('match');
        speak(message);
        finishLevel(next);
        return;
      }
      if (held) setRemovedIds((previous) => previous.filter((id) => id !== held.id));
      setHeldId(null);
      releaseCarriedBody();
      playActionAnimation('drop');
      setFeedback('הצורה מתאימה למקום אחר. היא חזרה לסדנה.');
      playAudioCue('retry');
      speak('כמעט, נסו מקום אחר.');
      return;
    }

    setFeedback('הידיים מלאות. הביאו קודם את הפריט אל היעד.');
  }, [
    attachCarriedBody,
    currentLevel,
    finishLevel,
    gameId,
    heldId,
    isCelebrating,
    nearestInteractiveEntity,
    playActionAnimation,
    progress,
    releaseCarriedBody,
    speak
  ]);

  const setDirection = useCallback((direction: DirectionCommand, pressed: boolean) => {
    if (isCelebrating) return;
    inputRef.current = { ...inputRef.current, [direction]: pressed };
  }, [isCelebrating]);

  if (!currentLevel || !world) return null;
  const heldEntity = currentLevel.entities.find((entity) => entity.id === heldId);
  const colorStations = new Map(
    currentLevel.entities.filter((entity) => entity.kind === 'station').map((entity) => [entity.id, entity])
  );
  const animation: CharacterAnimationState = isCelebrating
    ? 'celebrate'
    : actionAnimation
      ?? (snapshot.speed > 12 ? (heldId ? 'carry-walk' : 'walk') : 'idle');
  const worldStyle = (position: { x: number; y: number }) => ({
    left: `${(position.x / world.width) * 100}%`,
    top: `${(position.y / world.height) * 100}%`
  });

  return (
    <GameWorld
      gameId={gameId}
      title={title}
      scoreLabel="הושלמו"
      scoreValue={progress}
      status={`${levelIndex + 1}/${availableLevels.length}`}
      onBack={onBack}
      backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}
    >
      <ProgressBar current={levelIndex + 1} total={availableLevels.length} />
      <div className={`game-play-card experience-game experience-game--${gameId}`}>
        <div className="experience-game__heading">
          <div>
            <span className="question-card__tag">משחק חווייתי</span>
            <h2>{currentLevel.title}</h2>
            <p>{currentLevel.instruction}</p>
          </div>
          <div className="experience-game__carry" aria-live="polite">
            <span>{gameId === 'colors' ? 'צבע במכחול' : 'בידיים'}</span>
            <strong style={heldEntity?.color ? { background: heldEntity.color } : undefined}>
              {heldEntity?.imageAssetId && heldEntity.imageAssetId !== 'experienceSprites'
                ? <GameImage assetId={heldEntity.imageAssetId} alt="" decorative className="experience-entity__image" />
                : heldEntity?.sprite
                  ? <ExperienceSprite sprite={heldEntity.sprite} />
                  : '—'}
            </strong>
          </div>
        </div>
        <div
          ref={arenaRef}
          className={`experience-arena experience-arena--physics ${tuning.guideStrength > 0.8 ? 'experience-arena--guided' : ''}`}
          tabIndex={0}
          role="application"
          aria-label={`${currentLevel.title}. השתמשו בחצים או במקשי WASD כדי לנוע וברווח כדי לבצע פעולה.`}
          onKeyDown={(event) => {
            const direction = keyboardDirection(event.key);
            if (direction) {
              event.preventDefault();
              if (event.repeat) return;
              setDirection(direction, true);
              return;
            }
            if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
              event.preventDefault();
              interact();
            }
          }}
          onKeyUp={(event) => {
            const direction = keyboardDirection(event.key);
            if (!direction) return;
            event.preventDefault();
            setDirection(direction, false);
          }}
          onBlur={clearInput}
          style={{
            '--experience-render-scale': arenaViewport.width && arenaViewport.height
              ? Math.min(arenaViewport.width / world.width, arenaViewport.height / world.height)
              : 1
          } as CSSProperties}
          data-testid="experience-arena"
          data-world-width={world.width}
          data-world-height={world.height}
          data-render-width={arenaViewport.width.toFixed(1)}
          data-render-height={arenaViewport.height.toFixed(1)}
        >
          {world.obstacles.map((obstacle) => {
            const position = snapshot.obstaclePositions[obstacle.id] ?? obstacle.position;
            return (
              <div
                key={obstacle.id}
                className={`experience-obstacle experience-obstacle--${obstacle.kind}`}
                style={{
                  ...worldStyle(position),
                  width: `${(obstacle.width / world.width) * 100}%`,
                  height: `${(obstacle.height / world.height) * 100}%`
                }}
                aria-hidden="true"
                data-obstacle-id={obstacle.id}
              />
            );
          })}
          {currentLevel.entities.map((entity) => {
            if (removedIds.includes(entity.id)) return null;
            const position = entityPositions.get(entity.id);
            if (!position) return null;
            const isDone = completedIds.includes(entity.id);
            const completedColor = isDone && entity.accepts ? colorStations.get(entity.accepts)?.color : undefined;
            const isNear = nearestInteractiveEntity?.id === entity.id;
            return (
              <div
                key={entity.id}
                className={`experience-entity experience-entity--${entity.kind} ${isDone ? 'experience-entity--done' : ''} ${isNear ? 'experience-entity--near' : ''}`}
                style={{ ...worldStyle(position), ...(completedColor ? { background: completedColor } : {}) }}
                role="img"
                aria-label={entity.label}
                data-entity-id={entity.id}
                data-kind={entity.kind}
                data-x={position.x}
                data-y={position.y}
                data-accepts={entity.accepts}
                data-image-asset-id={entity.imageAssetId}
              >
                {entity.imageAssetId && entity.imageAssetId !== 'experienceSprites'
                  ? <GameImage assetId={entity.imageAssetId} alt="" decorative className="experience-entity__image" />
                  : entity.sprite
                    ? <ExperienceSprite sprite={entity.sprite} />
                    : <span className="experience-entity__glyph" aria-hidden="true">{entity.fallbackGlyph}</span>}
                <small>{entity.label}</small>
              </div>
            );
          })}
          <div
            className="experience-player"
            style={worldStyle(snapshot.position)}
            data-x={snapshot.position.x}
            data-y={snapshot.position.y}
            data-speed={snapshot.speed.toFixed(2)}
          >
            <ExperienceCharacter
              gender={gender}
              learnerName={learnerName}
              animation={animation}
              facing={facing}
              tick={snapshot.tick}
            />
            {heldEntity ? (
              <span className="experience-player__carried" aria-hidden="true">
                {heldEntity.imageAssetId && heldEntity.imageAssetId !== 'experienceSprites'
                  ? <GameImage assetId={heldEntity.imageAssetId} alt="" decorative className="experience-entity__image" />
                  : heldEntity.sprite
                    ? <ExperienceSprite sprite={heldEntity.sprite} />
                    : null}
              </span>
            ) : null}
          </div>
        </div>
        <AnimatedFeedback message={feedback} tone={isCelebrating ? 'correct' : 'neutral'} />
        <div className="experience-game__help">
          <kbd>↑ ↓ ← → / WASD</kbd><span>מחזיקים כדי ללכת</span><kbd>רווח</kbd><span>מרימים, מניחים או צובעים</span>
        </div>
        <GameControls
          onDirectionStart={(direction) => setDirection(direction, true)}
          onDirectionEnd={(direction) => setDirection(direction, false)}
          onAction={interact}
          disabled={isCelebrating}
        />
      </div>
    </GameWorld>
  );
}
