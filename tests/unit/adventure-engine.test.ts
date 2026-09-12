// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  adventureMissions,
  alphabet,
} from "../../src/content/adventureMissions";
import {
  isCorrectAction,
  missionSteps,
  quantityLimit,
  selectAdventureMissions,
} from "../../src/components/games/experience/adventureEngine";
import {
  createProfile,
  getAdventureProgress,
  getLearningSnapshot,
  getProfileData,
  saveAdventureProgress,
  SNAPSHOT_KEY,
} from "../../src/services/learningStoreService";
import type { Age, Difficulty } from "../../src/types";
import type { AdventureProgress } from "../../src/types/adventure.types";

describe("adventure curriculum", () => {
  it("provides four authored stories per mechanic and 12 per world", () => {
    expect(adventureMissions).toHaveLength(48);
    for (const game of ["letters", "numbers", "shapes", "colors"] as const) {
      const missions = adventureMissions.filter((m) => m.gameId === game);
      expect(missions).toHaveLength(12);
      const families = [...new Set(missions.map((m) => m.activity))];
      expect(families).toHaveLength(3);
      families.forEach((f) =>
        expect(missions.filter((m) => m.activity === f)).toHaveLength(4),
      );
    }
  });
  it("selects one of each mechanic and avoids the previous round", () => {
    for (const game of ["letters", "numbers", "shapes", "colors"] as const) {
      const first = selectAdventureMissions(game, [], 17),
        next = selectAdventureMissions(
          game,
          first.map((m) => m.id),
          17,
        );
      expect(new Set(next.map((m) => m.activity)).size).toBe(3);
      expect(next.every((m) => !first.some((old) => old.id === m.id))).toBe(
        true,
      );
      expect(selectAdventureMissions(game, [], 17)).toEqual(first);
    }
  });
  it("covers all letters through replay seeds, with consistent geometry", () => {
    const seen = new Set<string>();
    for (const m of adventureMissions.filter((m) => m.gameId === "letters"))
      for (let seed = 0; seed < 30; seed++) {
        const steps = missionSteps(m, { age: 4, difficulty: "medium" }, seed);
        for (const step of steps)
          if (step.kind === "choose") seen.add(step.answer);
        if (m.activity === "letter-build")
          expect(
            steps.filter((s) => s.kind === "place").map((s) => s.part),
          ).toEqual([0, 1, 2]);
      }
    expect([...seen].sort()).toEqual(alphabet.map((e) => e[0]).sort());
  });
  for (const age of [3, 4, 5, 6] as Age[])
    for (const difficulty of ["easy", "medium", "hard"] as Difficulty[])
      it(`all missions solvable at age ${age}, ${difficulty}`, () => {
        for (const mission of adventureMissions)
          for (let seed = 0; seed < 10; seed++)
            for (const step of missionSteps(
              mission,
              { age, difficulty },
              seed,
            )) {
              expect(isCorrectAction(step, step.answer, 0)).toBe(true);
              expect(isCorrectAction(step, "invalid", 0)).toBe(false);
              if (["place", "paint", "choose"].includes(step.kind))
                expect(step.options).toContain(step.answer);
              if (step.kind === "count")
                expect(step.count).toBeLessThanOrEqual(
                  quantityLimit({ age, difficulty }),
                );
            }
      });
  it("rejects wrong rotation and wrong recipes while allowing a full turn", () => {
    const turning = missionSteps(
      adventureMissions.find((m) => m.activity === "shape-turn")!,
      { age: 5, difficulty: "hard" },
      1,
    )[0];
    expect(isCorrectAction(turning, turning.answer, -90)).toBe(false);
    expect(isCorrectAction(turning, turning.answer, 360)).toBe(true);
    const mixing = missionSteps(
      adventureMissions.find((m) => m.id === "v2-color-orange")!,
      { age: 4, difficulty: "medium" },
      1,
    )[0];
    expect(isCorrectAction(mixing, "red+yellow")).toBe(true);
    expect(isCorrectAction(mixing, "blue+red")).toBe(false);
  });
  it("introduces letter groups gradually and makes either plate the larger one", () => {
    const first = selectAdventureMissions("letters", [], 17);
    expect(first.every((m) => m.variant === 0)).toBe(true);
    const next = selectAdventureMissions(
      "letters",
      first.map((m) => m.id),
      17,
    );
    expect(next.every((m) => m.variant === 1)).toBe(true);
    const mission = adventureMissions.find((m) => m.activity === "share")!;
    const answers = new Set(
      [0, 1].map(
        (seed) =>
          missionSteps(mission, { age: 4, difficulty: "medium" }, seed).at(-1)!
            .answer,
      ),
    );
    expect(answers).toEqual(new Set(["first", "second"]));
  });
  it("revisits a struggling mission once new content has been explored", () => {
    const recent = adventureMissions
      .filter((m) => m.gameId === "colors")
      .map((m) => m.id);
    const evidence = Array.from({ length: 6 }, (_, i) => ({
      contentId: "v2-color-festival.color-0.1",
      correct: false,
      hintUsed: true,
      attemptNumber: i + 1,
    })) as import("../../src/types").LearningEvent[];
    expect(
      selectAdventureMissions("colors", recent, 17, evidence).map((m) => m.id),
    ).toContain("v2-color-festival");
  });
});

describe("adventure persistence and evidence", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("adds progress to an old v4 profile without losing history", () => {
    const profile = createProfile({ id: "child" });
    const snapshot = getLearningSnapshot();
    snapshot.dataByProfile.child.journey.completedLevelIds = ["old-level"];
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    expect(getAdventureProgress(profile.id, "colors").completed).toEqual([]);
    saveAdventureProgress(profile.id, "colors", {
      version: 1,
      completed: ["v2-color-petals"],
      recent: [],
      rewards: ["v2-color-petals"],
    });
    expect(getProfileData(profile.id).journey.completedLevelIds).toEqual([
      "old-level",
    ]);
  });
  it("atomically saves checkpoint and evidence and deduplicates retries", () => {
    createProfile({ id: "child" });
    const progress: AdventureProgress = {
      version: 1,
      completed: [],
      recent: [],
      rewards: [],
      checkpoint: {
        sessionId: "round",
        missionIds: ["v2-number-breakfast"],
        missionIndex: 0,
        stepIndex: 1,
        attempt: 1,
        hint: false,
        seed: 137,
        age: 4,
        difficulty: "medium",
        evidenceKeys: [],
      },
    };
    const event = {
      profileId: "child",
      sessionId: "round",
      contentId: "v2-number-breakfast.plate.137",
      skillIds: ["math.quantity-sense"] as const,
      gameId: "numbers" as const,
      evidenceForm: "adventure-drag" as const,
      correct: true,
      attemptNumber: 2,
      hintUsed: true,
      responseMs: 1000,
      monotonicMs: 1000,
    };
    saveAdventureProgress("child", "numbers", progress, {
      ...event,
      skillIds: [...event.skillIds],
    });
    saveAdventureProgress("child", "numbers", progress, {
      ...event,
      skillIds: [...event.skillIds],
    });
    const data = getProfileData("child");
    expect(data.events).toHaveLength(1);
    expect(data.events[0].hintUsed).toBe(true);
    expect(data.adventures?.numbers?.checkpoint?.stepIndex).toBe(1);
  });
  it("isolates profiles and never revives a deleted profile", () => {
    createProfile({ id: "first" });
    createProfile({ id: "second" });
    const progress: AdventureProgress = {
      version: 1,
      completed: ["a"],
      recent: [],
      rewards: ["a"],
    };
    saveAdventureProgress("first", "letters", progress);
    expect(getAdventureProgress("second", "letters").completed).toEqual([]);
    saveAdventureProgress("missing", "letters", progress);
    expect(getLearningSnapshot().dataByProfile.missing).toBeUndefined();
  });
});
