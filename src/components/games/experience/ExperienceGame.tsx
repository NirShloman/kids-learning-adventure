import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MotionConfig, motion } from "motion/react";
import {
  adventureMissions,
  adventureWorlds,
} from "../../../content/adventureMissions";
import type {
  AccessibilitySettings,
  Age,
  CharacterSkin,
  Difficulty,
  ExperienceGameId,
  LearnerGender,
} from "../../../types";
import type {
  AdventureCheckpoint,
  AdventureProgress,
} from "../../../types/adventure.types";
import {
  getActiveProfile,
  getAdventureProgress,
  getProfileData,
  saveAdventureProgress,
} from "../../../services/learningStoreService";
import { useGameFeedback } from "../../../hooks/useGameFeedback";
import { useSpeech } from "../../../hooks/useSpeech";
import { playSfx } from "../../../services/audioService";
import {
  isCorrectAction,
  itemLabel,
  missionSteps,
  selectAdventureMissions,
} from "./adventureEngine";
import { preloadAdventure } from "./adventurePreload";
import { ActivityDemo } from "./ActivityDemo";
import { WorldCreation } from "./WorldCreation";
import "./adventure.css";

const NumbersAdventure = lazy(() =>
  import("./NumbersAdventure").then((m) => ({ default: m.NumbersAdventure })),
);
const LettersAdventure = lazy(() =>
  import("./LettersAdventure").then((m) => ({ default: m.LettersAdventure })),
);
const ShapesAdventure = lazy(() =>
  import("./ShapesAdventure").then((m) => ({ default: m.ShapesAdventure })),
);
const ColorsAdventure = lazy(() =>
  import("./ColorsAdventure").then((m) => ({ default: m.ColorsAdventure })),
);
interface ExperienceGameProps {
  gameId: ExperienceGameId;
  title: string;
  age: Age;
  difficulty: Difficulty;
  gender: LearnerGender;
  learnerName: string;
  voiceEnabled: boolean;
  avatarId?: CharacterSkin;
  accessibility?: AccessibilitySettings;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}
export function ExperienceGame(props: ExperienceGameProps) {
  const {
    gameId,
    age,
    difficulty,
    gender,
    learnerName,
    voiceEnabled,
    onBack,
    onFinish,
    accessibility,
    avatarId,
  } = props;
  const profile = useRef(getActiveProfile()).current;
  const skin = avatarId ?? (gender === "boy" ? "nir-kippah" : "shir");
  const { speak, stop, preload } = useSpeech(voiceEnabled);
  const response = useGameFeedback(voiceEnabled);
  const progressRef = useRef<AdventureProgress>(
    profile
      ? getAdventureProgress(profile.id, gameId)
      : { version: 1, completed: [], rewards: [], recent: [] },
  );
  const [checkpoint, setCheckpoint] = useState<AdventureCheckpoint>(() => {
    const previous = progressRef.current.checkpoint;
    if (
      previous &&
      previous.age === age &&
      previous.difficulty === difficulty &&
      Number.isInteger(previous.missionIndex) &&
      previous.missionIndex >= 0 &&
      previous.missionIndex < 3 &&
      Number.isInteger(previous.stepIndex) &&
      previous.stepIndex >= 0 &&
      previous.stepIndex < 5 &&
      previous.attempt >= 1 &&
      Number.isFinite(previous.seed) &&
      previous.missionIds.length === 3 &&
      previous.missionIds.every((id) =>
        adventureMissions.some((m) => m.id === id && m.gameId === gameId),
      )
    )
      return previous;
    const seed = Math.floor(Math.random() * 1_000_000);
    const missions = selectAdventureMissions(
      gameId,
      progressRef.current.recent,
      seed,
      profile ? getProfileData(profile.id).events : [],
    );
    const confidence = profile
      ? Math.min(
          ...missions[0].skillIds.map(
            (id) => getProfileData(profile.id).mastery[id]?.confidence ?? 0,
          ),
        )
      : 0;
    const challenge =
      profile?.learningMode === "automatic"
        ? confidence < 25
          ? "easy"
          : confidence < 65
            ? "medium"
            : "hard"
        : difficulty;
    return {
      sessionId: crypto.randomUUID(),
      seed,
      age,
      difficulty,
      challenge,
      fewerItems: accessibility?.fewerItems,
      missionIds: missions.map((m) => m.id),
      missionIndex: 0,
      stepIndex: 0,
      attempt: 1,
      hint: false,
      evidenceKeys: [],
    };
  });
  const checkpointRef = useRef(checkpoint);
  const [intro, setIntro] = useState(checkpoint.stepIndex === 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryLoad, setRetryLoad] = useState(0);
  const busyRef = useRef(false);
  const startedRef = useRef(performance.now());
  const mission = adventureMissions.find(
    (m) => m.id === checkpoint.missionIds[checkpoint.missionIndex],
  )!;
  const steps = missionSteps(
    mission,
    {
      age,
      difficulty: checkpoint.challenge ?? difficulty,
      fewerItems: checkpoint.fewerItems,
    },
    checkpoint.seed,
  );
  const step = steps[Math.min(checkpoint.stepIndex, steps.length - 1)];
  const world = adventureWorlds[gameId];
  const reduced = Boolean(accessibility?.reducedMotion);
  const persist = (
    cp: AdventureCheckpoint,
    evidence?: Parameters<typeof saveAdventureProgress>[3],
  ) => {
    progressRef.current = { ...progressRef.current, checkpoint: cp };
    checkpointRef.current = cp;
    if (profile)
      saveAdventureProgress(profile.id, gameId, progressRef.current, evidence);
  };
  useEffect(() => {
    persist(checkpointRef.current);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    preloadAdventure(gameId, skin)
      .then(() => {
        if (active) setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setLoadError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [gameId, skin, retryLoad]);
  useEffect(() => {
    preload([
      mission.story,
      mission.instruction,
      ...steps.map((s) => s.prompt),
      "מצוין!",
      "ננסה שוב. אפשר להיעזר ברמז.",
    ]);
    const upcoming = adventureMissions.find(
      (m) => m.id === checkpoint.missionIds[checkpoint.missionIndex + 1],
    );
    if (upcoming)
      preload([
        `${upcoming.title}. ${upcoming.story}`,
        upcoming.story,
        ...missionSteps(
          upcoming,
          {
            age,
            difficulty: checkpoint.challenge ?? difficulty,
            fewerItems: checkpoint.fewerItems,
          },
          checkpoint.seed,
        ).map((s) => s.prompt),
      ]);
    if (!loading && !paused && !response.locked.current)
      speak(intro ? `${mission.title}. ${mission.story}` : step.prompt);
    startedRef.current = performance.now();
    return stop;
  }, [mission.id, step.id, intro, loading, speak, stop, preload]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        setPaused(true);
        stop();
        setSelected(null);
      } else setPaused(false);
    };
    const appPause = (e: Event) => {
      if (!(e as CustomEvent<{ isActive: boolean }>).detail.isActive) {
        setPaused(true);
        stop();
        setSelected(null);
      } else setPaused(false);
    };
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("lomdim:app-state", appPause);
    return () => {
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("lomdim:app-state", appPause);
      stop();
    };
  }, [stop]);
  const answer = (value: string, rotation = 0) => {
    if (busyRef.current || response.locked.current || intro || paused || loading) return;
    const current = checkpointRef.current;
    const correct = isCorrectAction(step, value, rotation);
    const evidence = profile
      ? {
          profileId: profile.id,
          sessionId: current.sessionId,
          contentId: `${mission.id}.${step.id}.${current.seed}`,
          skillIds:
            mission.activity === "letter-build" && step.kind === "place"
              ? ["motor.fine" as const]
              : mission.skillIds,
          gameId,
          evidenceForm:
            step.kind === "choose"
              ? gameId === "letters" && voiceEnabled
                ? ("listening-choice" as const)
                : ("visual-choice" as const)
              : mission.evidenceForm,
          correct,
          attemptNumber: current.attempt,
          hintUsed: current.hint || Boolean(accessibility?.strongGuidance),
          responseMs: Math.round(performance.now() - startedRef.current),
          monotonicMs: Math.round(performance.now()),
        }
      : undefined;
    if (!correct) {
      const next = {
        ...current,
        attempt: current.attempt + 1,
        hint: current.hint || current.attempt >= 2,
      };
      persist(next, evidence);
      setCheckpoint(next);
      setFeedback("כמעט. נבדוק וננסה שוב.");

      busyRef.current = true;
      setBusy(true);
      response.run("ננסה שוב. אפשר להיעזר ברמז.", () => {
        busyRef.current = false;
        setBusy(false);
      }, false);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setFeedback("מצוין!");
    const finished = current.stepIndex + 1 >= steps.length;
    const next = {
      ...current,
      stepIndex: finished ? 0 : current.stepIndex + 1,
      missionIndex: current.missionIndex + (finished ? 1 : 0),
      attempt: 1,
      hint: false,
    };
    if (finished)
      progressRef.current = {
        ...progressRef.current,
        completed: [...new Set([...progressRef.current.completed, mission.id])],
        rewards: [...new Set([...progressRef.current.rewards, mission.id])],
        recent: [
          ...progressRef.current.recent.filter((id) => id !== mission.id),
          mission.id,
        ].slice(-12),
        creations: [
          ...(progressRef.current.creations ?? []),
          {
            id: `${current.sessionId}.${mission.id}`,
            missionId: mission.id,
            seed: current.seed,
            completedAt: new Date().toISOString(),
          },
        ].slice(-120),
      };
    persist(next, evidence);
    response.run("מצוין!",
      () => {
        setSelected(null);
        setFeedback("");
        if (finished) {
          setCelebration(true);
          playSfx("levelComplete");

        } else {
          setCheckpoint(next);
          busyRef.current = false;
          setBusy(false);
        }
      },
      true,
    );
  };
  const nextMission = () => {
    const next = checkpointRef.current;
    if (next.missionIndex >= 3) {
      progressRef.current = { ...progressRef.current, checkpoint: undefined };
      if (profile)
        saveAdventureProgress(profile.id, gameId, progressRef.current);
      onFinish(3, 3, 3);
      return;
    }
    setCheckpoint(next);
    setCelebration(false);
    setIntro(true);
    setBusy(false);
    busyRef.current = false;
  };
  useEffect(() => {
    if (celebration && !paused) response.run(`הצלחנו! ${mission.reward} נוספה לאוסף שלנו.`, nextMission);
  }, [celebration, paused]);
  const hint = () => {
    if (response.locked.current) return;
    const next = { ...checkpointRef.current, hint: true };
    persist(next);
    setCheckpoint(next);
    speak(step.prompt);
    playSfx("select");
  };
  const boardProps = {
    mission,
    step,
    selected,
    hint: checkpoint.hint || Boolean(accessibility?.strongGuidance),
    busy,
    onSelect: (value: string) => {
      setSelected(value);
      playSfx("pickup");
      speak(itemLabel(value), { mode: "hint" });
    },
    onAnswer: answer,
  };
  const Board = {
    letters: LettersAdventure,
    numbers: NumbersAdventure,
    shapes: ShapesAdventure,
    colors: ColorsAdventure,
  }[gameId];
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <section
        className={`adventure adventure--${gameId}`}
        dir="rtl"
        style={
          {
            "--adventure-accent": world.color,
            "--adventure-background": `url("${world.image}")`,
          } as CSSProperties
        }
        data-testid="adventure"
        data-game={gameId}
        data-mission={mission.id}
        data-step={step.id}
        data-activity={mission.activity}
        data-seed={checkpoint.seed}
        data-difficulty={checkpoint.challenge ?? difficulty}
        data-reduced-motion={reduced}
        data-strong-snap={Boolean(accessibility?.strongSnap)}
      >
        <header className="adventure-header">
          <button
            type="button"
            className="adventure-icon-button"
            aria-label="חזרה לתפריט המשחקים"
            onClick={() => {
              stop();
              onBack();
            }}
          >
            →
          </button>
          <div>
            <span>{world.title}</span>
            <h1>{mission.title}</h1>
          </div>
          <div
            className="adventure-session-progress"
            role="group"
            aria-label={`משימה ${checkpoint.missionIndex + 1} מתוך 3`}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={
                  i < checkpoint.missionIndex
                    ? "is-done"
                    : i === checkpoint.missionIndex
                      ? "is-current"
                      : ""
                }
              >
                {i < checkpoint.missionIndex ? "✓" : i + 1}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="adventure-icon-button"
            aria-label="השמעת ההוראה"
            disabled={response.busy}
            onClick={() => speak(intro ? mission.story : step.prompt)}
          >
            ♪
          </button>
        </header>
        <div className="adventure-scene" data-testid="adventure-scene">
          <div className="adventure-ambient" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="adventure-guide">
            <motion.img
              src={`/assets/experience/v2/${skin}-${celebration ? "celebrate" : selected ? "point" : "idle"}.webp`}
              alt={learnerName ? `${learnerName}, משחקים יחד` : "משחקים יחד"}
              data-skin={skin}
              animate={celebration ? { y: [0, -12, 0] } : { y: [0, -2, 0] }}
              transition={{
                duration: celebration ? 0.8 : 3.5,
                repeat: Infinity,
              }}
            />
          </div>
          {loading ? (
            <div className="adventure-overlay">
              <p role="status">מכינים עולם של הפתעות…</p>
            </div>
          ) : loadError ? (
            <div className="adventure-overlay">
              <h2>עוד רגע מתחילים</h2>
              <p>חלק מהתמונות עדיין לא נטענו.</p>
              <button
                className="adventure-primary"
                onClick={() => setRetryLoad((n) => n + 1)}
              >
                ננסה שוב
              </button>
            </div>
          ) : intro ? (
            <div className="adventure-overlay adventure-intro">
              <span className="adventure-kicker">הרפתקה קטנה מתחילה</span>
              <h2>{mission.title}</h2>
              <p>{mission.story}</p>
              <ActivityDemo mission={mission} step={step} />
              <p className="adventure-intro-instruction">
                {mission.instruction}
              </p>
              <button
                type="button"
                className="adventure-primary"
                onClick={() => {
                  setIntro(false);
                  playSfx("levelStart");
                }}
              >
                מתחילים לשחק <span aria-hidden="true">←</span>
              </button>
            </div>
          ) : celebration ? (
            <div className="adventure-overlay adventure-celebration">
              <WorldCreation
                mission={mission}
                seed={checkpoint.seed}
                playing={!reduced}
              />
              <h2>איזה יופי, הצלחנו!</h2>
              <p>{mission.reward} נוספה לאוסף שלנו</p>
              <p role="status">עוד רגע ממשיכים…</p>
            </div>
          ) : (
            <>
              <div className="adventure-instruction">
                <p>{step.prompt}</p>
                <button
                  type="button"
                  className="adventure-hint-button"
                  aria-label="רמז"
                  disabled={busy}
                  onClick={hint}
                >
                  ✦
                </button>
              </div>
              <div className="adventure-board" key={`${mission.id}.${step.id}`}>
                <Suspense fallback={<p>מכינים את המשחק…</p>}>
                  <Board {...boardProps} />
                </Suspense>
              </div>
              <div
                className="adventure-feedback"
                role="status"
                aria-live="polite"
              >
                {feedback || response.message || (
                  <span dir="ltr">
                    {Math.min(checkpoint.stepIndex + 1, steps.length)} /{" "}
                    {steps.length}
                  </span>
                )}
              </div>
            </>
          )}
          {paused && (
            <div className="adventure-overlay adventure-pause">
              <h2>כיף שחזרתם</h2>
              <p>המשחק מחכה בדיוק כאן.</p>
              <button
                className="adventure-primary"
                onClick={() => { setPaused(false); response.resume(); }}
              >
                ממשיכים לשחק
              </button>
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
}
