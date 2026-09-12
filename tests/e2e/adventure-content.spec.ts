import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { missionSteps } from "../../src/components/games/experience/adventureEngine";
import { openAdventure, solveMission } from "./adventure-helpers";
for (const mission of adventureMissions)
  test(`${mission.id}: ${mission.title}`, async ({ page }) => {
    await openAdventure(page, mission);
    const step = missionSteps(
      mission,
      { age: 4, difficulty: "medium" },
      137,
    )[0];
    if (step.kind === "count")
      await page.getByRole("button", { name: /מגישים/ }).click();
    else if (step.kind === "mix") {
      for (let i = 0; i < 2; i++) {
        await page.locator('[data-toy="red"]').click();
        await page.locator("[data-drop-zone]").click();
      }
      await page.getByRole("button", { name: "מערבבים!" }).click();
    } else {
      const wrong = step.options.find((value) => value !== step.answer)!;
      await page.locator(`[data-toy="${wrong}"]`).click();
      if (step.kind !== "choose")
        await page.locator("[data-drop-zone]").click();
    }
    await expect(page.locator(".adventure-feedback")).toContainText("כמעט");
    await page.getByRole("button", { name: "רמז", exact: true }).click();
    await solveMission(page, mission);
    const data = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
          .dataByProfile["adventure-test"],
    );
    expect(data.events[0].correct).toBe(false);
    expect(data.events[1]).toMatchObject({
      correct: true,
      hintUsed: true,
      attemptNumber: 2,
    });
    expect(data.adventures[mission.gameId].completed).toContain(mission.id);
  });
