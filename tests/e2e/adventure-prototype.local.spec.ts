import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { openAdventure, solveMission } from "./adventure-helpers";
test("kitchen vertical slice: real quantities, evidence and celebration", async ({
  page,
}) => {
  const mission = adventureMissions.find(
    (m) => m.id === "v2-number-breakfast",
  )!;
  await openAdventure(page, mission);
  await page.screenshot({ path: "tmp/adventure-kitchen.png" });
  await solveMission(page, mission);
  const data = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
        .dataByProfile["adventure-test"],
  );
  expect(data.adventures.numbers.completed).toContain(mission.id);
  expect(data.events.length).toBe(2);
});
