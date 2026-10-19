import { useEffect, useState } from "react";
import type {
  Age,
  Difficulty,
  GameId,
  MatchingPair,
  MemoryPair,
} from "../../../types";
import type {
  DetectiveItem,
  DetectiveRound,
} from "../../../types/detective.types";
import {
  getActiveProfile,
  getDetectiveProgress,
  saveDetectiveRound,
} from "../../../services/learningStoreService";
import { loadGameContent } from "../../../services/staticContentRepository";
import {
  getDetectivePairs,
  getPatternPuzzles,
  getQuizQuestions,
  getSortingChallenges,
  pairCount,
} from "../../../services/questionService";
import { canResume, newRound, resumeRound } from "./detectiveEngine";
import { DetectiveSession } from "./DetectiveSession";
import { calculateStars } from "../../../utils/helpers";

export interface DetectiveGameProps {
  gameId: GameId;
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  initialItems?: DetectiveItem[];
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}
export function DetectiveGame({
  gameId,
  age,
  difficulty,
  voiceEnabled,
  initialItems,
  onBack,
  onFinish,
}: DetectiveGameProps) {
  const profile = getActiveProfile();
  const [loaded, setLoaded] = useState<{
      items: DetectiveItem[];
      round: DetectiveRound;
    } | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoaded(null);
    setError("");
    (async () => {
      if (!profile) throw new Error("profile");
      const bank = await loadGameContent<DetectiveItem>(gameId),
        saved = getDetectiveProgress(profile.id).rounds[gameId];
      if (canResume(saved, bank.contentVersion, age, difficulty, bank.items)) {
        if (active) setLoaded({ items: bank.items, round: resumeRound(saved) });
        return;
      }
      const count = Math.max(
        2,
        pairCount(age, difficulty) - (profile.accessibility.fewerItems ? 1 : 0),
      );
      let selected: DetectiveItem[];
      if (gameId === "matching" || gameId === "memory")
        selected = await getDetectivePairs<MatchingPair | MemoryPair>(
          gameId,
          age,
          difficulty,
          count,
        );
      else if (gameId === "patterns")
        selected = await getPatternPuzzles(age, difficulty);
      else if (gameId === "sorting")
        selected = await getSortingChallenges(age, difficulty);
      else
        selected =
          initialItems ?? (await getQuizQuestions(gameId, age, difficulty));
      if (
        profile.accessibility.fewerItems &&
        gameId !== "matching" &&
        gameId !== "memory"
      )
        selected = selected.slice(0, Math.max(3, selected.length - 2));
      if (!selected.length) throw new Error("empty content");
      const steps =
        gameId === "matching" || gameId === "memory"
          ? [{ gameId, ids: selected.map((item) => item.id) }]
          : selected.map((item) => ({ gameId, ids: [item.id] }));
      const round = newRound(steps, bank.contentVersion, age, difficulty);
      if (active) {
        saveDetectiveRound(profile.id, gameId, round);
        setLoaded({ items: bank.items, round });
      }
    })().catch(() => {
      if (active) setError("לא הצלחנו להכין את המשחק. אפשר לנסות שוב.");
    });
    return () => {
      active = false;
    };
  }, [
    gameId,
    age,
    difficulty,
    profile?.id,
    profile?.accessibility.fewerItems,
    retry,
    initialItems,
  ]);
  if (error || !profile)
    return (
      <section className="detective-game game-world detective-error" dir="rtl">
        <p role="alert">{error || "בחרו פרופיל כדי להתחיל."}</p>
        <button
          className="detective-tool"
          onClick={() => setRetry((v) => v + 1)}
        >
          ננסה שוב
        </button>
        <button className="detective-tool" onClick={onBack}>
          חזרה לתפריט
        </button>
      </section>
    );
  if (!loaded)
    return (
      <section className="detective-game game-world" dir="rtl">
        <p role="status">מכינים תעלומה חדשה...</p>
      </section>
    );
  return (
    <DetectiveSession
      key={loaded.round.id}
      profile={profile}
      scope={gameId}
      items={loaded.items}
      initialRound={loaded.round}
      voiceEnabled={voiceEnabled}
      onBack={onBack}
      onFinish={(round) => {
        const values = Object.values(round.outcomes),
          score = values.filter((v) => v === "independent").length;
        onFinish(score, values.length, calculateStars(score, values.length));
      }}
    />
  );
}
