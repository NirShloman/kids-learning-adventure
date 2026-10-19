import { useEffect, useState } from "react";
import type { LearnerProfile, MatchingPair, MemoryPair } from "../types";
import type {
  DetectiveItem,
  DetectiveRound,
  DetectiveStep,
} from "../types/detective.types";
import { planAdaptiveSession } from "../learning/sessionPlanner";
import {
  loadGameContent,
  loadLearningContentIndex,
} from "../services/staticContentRepository";
import {
  getProfileData,
  getDetectiveProgress,
  saveDetectiveRound,
  saveActivePlan,
  saveSessionSummary,
} from "../services/learningStoreService";
import { getDetectivePairs } from "../services/questionService";
import {
  canResume,
  newRound,
  resumeRound,
} from "../components/games/detective/detectiveEngine";
import { DetectiveSession } from "../components/games/detective/DetectiveSession";
import { SummaryPage } from "./SummaryPage";
import { calculateStars } from "../utils/helpers";

interface Props {
  profile: LearnerProfile;
  onBack: () => void;
  onComplete: () => void;
}
export function AdaptiveSessionPage({ profile, onBack, onComplete }: Props) {
  const [loaded, setLoaded] = useState<{
      items: DetectiveItem[];
      round: DetectiveRound;
    } | null>(null),
    [error, setError] = useState(""),
    [finished, setFinished] = useState<DetectiveRound | null>(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    setLoaded(null);
    setFinished(null);
    (async () => {
      const [descriptors, banks] = await Promise.all([
        loadLearningContentIndex(),
        Promise.all(
          (
            [
              "letters",
              "numbers",
              "shapes",
              "colors",
              "matching",
              "memory",
              "patterns",
              "sorting",
            ] as const
          ).map((game) => loadGameContent<DetectiveItem>(game)),
        ),
      ]);
      const items = banks.flatMap((bank) => bank.items),
        version = banks.map((bank) => bank.contentVersion).join("|"),
        saved = getDetectiveProgress(profile.id).rounds.mixed;
      if (
        canResume(saved, version, profile.age, profile.manualDifficulty, items)
      ) {
        if (active) setLoaded({ items, round: resumeRound(saved) });
        return;
      }
      const data = getProfileData(profile.id);
      const plan = planAdaptiveSession(
        profile,
        data,
        descriptors,
        new Date(),
        crypto.randomUUID(),
      );
      const steps: DetectiveStep[] = [],
        used = new Set<string>();
      for (const task of plan.tasks) {
        if (used.has(task.contentId)) continue;
        if (task.gameId === "matching" || task.gameId === "memory") {
          const pairs = await getDetectivePairs<MatchingPair | MemoryPair>(
            task.gameId,
            profile.age,
            profile.manualDifficulty,
            profile.age <= 4 ? 2 : 3,
            task.contentId,
            [...used],
          );
          if (!pairs.length) throw new Error("Unavailable pair board");
          steps.push({
            gameId: task.gameId,
            ids: pairs.map((item) => item.id),
          });
        } else steps.push({ gameId: task.gameId, ids: [task.contentId] });
        steps[steps.length - 1].ids.forEach((id) => used.add(id));
      }
      if (!steps.length) throw new Error("Unavailable activities");
      const round = newRound(
        steps,
        version,
        profile.age,
        profile.manualDifficulty,
      );
      if (active) {
        saveActivePlan(profile.id, plan);
        saveDetectiveRound(profile.id, "mixed", round);
        setLoaded({ items, round });
      }
    })().catch(() => {
      if (active) setError("לא הצלחנו להכין את התרגול. אפשר לנסות שוב.");
    });
    return () => {
      active = false;
    };
  }, [profile.id, profile.age, profile.manualDifficulty, retry]);
  if (finished) {
    const values = Object.values(finished.outcomes),
      score = values.filter((v) => v === "independent").length;
    return (
      <SummaryPage
        title="תרגול מותאם"
        result={{
          score,
          total: values.length,
          stars: calculateStars(score, values.length),
        }}
        voiceEnabled={profile.narrationEnabled}
        onPlayAgain={() => setRetry((v) => v + 1)}
        onBackHome={onComplete}
      />
    );
  }
  if (error)
    return (
      <section className="detective-game" dir="rtl">
        <p role="alert">{error}</p>
        <button
          className="detective-tool"
          onClick={() => setRetry((v) => v + 1)}
        >
          ננסה שוב
        </button>
        <button className="detective-tool" onClick={onBack}>
          חזרה
        </button>
      </section>
    );
  if (!loaded)
    return (
      <section className="detective-game" dir="rtl">
        <p role="status">מכינים תרגול מותאם...</p>
      </section>
    );
  return (
    <DetectiveSession
      key={loaded.round.id}
      profile={profile}
      scope="mixed"
      items={loaded.items}
      initialRound={loaded.round}
      voiceEnabled={profile.narrationEnabled}
      onBack={onBack}
      onFinish={(round) => {
        const completedAt = new Date();
        saveActivePlan(profile.id, null);
        saveSessionSummary({
          id: round.id,
          profileId: profile.id,
          mode: "adaptive",
          startedAt: round.startedAt,
          completedAt: completedAt.toISOString(),
          durationSeconds: Math.max(
            1,
            Math.round(
              (completedAt.getTime() - new Date(round.startedAt).getTime()) /
                1000,
            ),
          ),
          correct: Object.values(round.outcomes).filter(
            (v) => v === "independent",
          ).length,
          total: Object.keys(round.outcomes).length,
        });
        setFinished(round);
      }}
    />
  );
}
