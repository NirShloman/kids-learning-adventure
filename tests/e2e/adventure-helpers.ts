import { expect, type Page } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { missionSteps } from "../../src/components/games/experience/adventureEngine";
import type { AdventureMission } from "../../src/types/adventure.types";
import type { AccessibilitySettings, Age, Difficulty } from "../../src/types";
import { openGame, selectGameMode } from "./helpers";

export async function openAdventure(
  page: Page,
  mission: AdventureMission,
  age: Age = 4,
  difficulty: Difficulty = "medium",
  accessibility: Partial<AccessibilitySettings> = {},
  seed = 137,
) {
  const sameGame = adventureMissions.filter(
    (m) => m.gameId === mission.gameId && m.activity !== mission.activity,
  );
  const ids = [mission.id, sameGame[0].id, sameGame[sameGame.length - 1].id];
  await page.addInitScript(
    ({ ids, age, difficulty, gameId, seed, accessibility }) => {
      if (sessionStorage.getItem("adventure-test-seeded")) return;
      sessionStorage.setItem("adventure-test-seeded", "true");
      const at = new Date().toISOString();
      const profile = {
        id: "adventure-test",
        name: "נועה",
        age,
        gender: "girl",
        avatarId: "shir",
        learningMode: "manual",
        manualDifficulty: difficulty,
        narrationEnabled: false,
        soundEffectsEnabled: false,
        musicEnabled: false,
        narrationVolume: 80,
        soundEffectsVolume: 75,
        musicVolume: 45,
        createdAt: at,
        updatedAt: at,
        accessibility: {
          noTimeLimit: true,
          reducedMotion: true,
          reducedParticles: true,
          reducedBackgroundAudio: true,
          fewerItems: false,
          largeTouchTargets: false,
          highContrast: false,
          slowNarration: false,
          extendedResponseTime: false,
          disableMovingObstacles: true,
          strongGuidance: false,
          strongSnap: false,
        },
      };
      Object.assign(profile.accessibility, accessibility);
      localStorage.setItem(
        "lomdim-bekef.learning.v4",
        JSON.stringify({
          schemaVersion: 4,
          migrationState: "complete",
          activeProfileId: profile.id,
          profiles: [profile],
          updatedAt: at,
          dataByProfile: {
            [profile.id]: {
              mastery: {},
              events: [],
              sessions: [],
              recentContent: {},
              activePlan: null,
              journey: {
                unlockedWorlds: ["letters"],
                completedLevelIds: [],
                decorationIds: [],
              },
              lastEffectiveNow: at,
              dailyContentCounts: {},
              adventures: {
                [gameId]: {
                  version: 1,
                  completed: [],
                  recent: [],
                  rewards: [],
                  checkpoint: {
                    sessionId: "test-session",
                    missionIds: ids,
                    missionIndex: 0,
                    stepIndex: 0,
                    attempt: 1,
                    hint: false,
                    seed,
                    age,
                    difficulty,
                    challenge: difficulty,
                    evidenceKeys: [],
                  },
                },
              },
            },
          },
        }),
      );
    },
    { ids, age, difficulty, gameId: mission.gameId, seed, accessibility },
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /מתחילים לשחק/ }).click();
  await expect(page.locator(".home-grid")).toBeVisible();
  await openGame(
    page,
    { letters: "אותיות", numbers: "מספרים", shapes: "צורות", colors: "צבעים" }[
      mission.gameId
    ] as "אותיות",
  );
  await selectGameMode(page, "experience");
  // The app's asset loader has a 15-second recovery deadline. Wait long enough
  // to observe that state rather than failing at the default 10-second click.
  await page
    .locator(".adventure-intro .adventure-primary")
    .click({ timeout: 25_000 });
  await expect(page.locator(".adventure-board")).toBeVisible();
}
export async function solveMission(
  page: Page,
  mission: AdventureMission,
  age: Age = 4,
  difficulty: Difficulty = "medium",
) {
  const steps = missionSteps(mission, { age, difficulty }, 137);
  for (const step of steps) {
    await expect(page.locator('[data-testid="adventure"]')).toHaveAttribute(
      "data-step",
      step.id,
    );
    if (step.kind === "count") {
      await page.locator('[data-toy="food"]').click();
      for (let i = step.initial ?? 0; i < (step.count ?? 0); i++)
        await page.locator("[data-drop-zone]").click();
      await page.getByRole("button", { name: /מגישים/ }).click();
    } else if (step.kind === "mix") {
      for (const color of step.answer.split("+")) {
        await page.locator(`[data-toy="${color}"]`).click();
        await page.locator("[data-drop-zone]").click();
      }
      await page.getByRole("button", { name: "מערבבים!" }).click();
    } else {
      await page.locator(`[data-toy="${step.answer}"]`).click();
      if (step.kind === "place" || step.kind === "paint") {
        if (step.rotation)
          await page
            .getByRole("button", { name: "סיבוב החלק ברבע סיבוב" })
            .click();
        await page.locator("[data-drop-zone]").click();
        if (step.kind === "paint")
          await page.getByRole("button", { name: "צביעה בנגיעה" }).click();
      }
    }
    await expect(page.locator(".adventure-feedback")).not.toHaveText(
      "כמעט. נבדוק וננסה שוב.",
    );
  }
  await expect(page.locator(".adventure-celebration")).toBeVisible();
}
