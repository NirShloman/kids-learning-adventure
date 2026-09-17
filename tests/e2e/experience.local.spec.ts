import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { missionSteps } from "../../src/components/games/experience/adventureEngine";
import { openAdventure, solveMission } from "./adventure-helpers";
import { openGame, selectGameMode, installConsoleErrorGuard } from "./helpers";

test.describe.configure({ timeout: 90_000 });
test.use({ video: "on" });
for (const game of ["letters", "numbers", "shapes", "colors"] as const)
  test(`${game}: complete three different mechanics and replay collection`, async ({
    page,
  }, info) => {
    const guard = installConsoleErrorGuard(page);
    const mission = adventureMissions.find((m) => m.gameId === game)!;
    await openAdventure(page, mission);
    const scene = await page
      .locator('[data-testid="adventure-scene"]')
      .boundingBox();
    expect(scene!.height / page.viewportSize()!.height).toBeGreaterThanOrEqual(
      0.7,
    );
    const ids = await page.evaluate(
      (game) =>
        JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
          .dataByProfile["adventure-test"].adventures[game].checkpoint
          .missionIds,
      game,
    );
    for (let i = 0; i < 3; i++) {
      await solveMission(page, adventureMissions.find((m) => m.id === ids[i])!);
      await page.locator(".adventure-celebration .adventure-primary").click();
      if (i < 2)
        await page.locator(".adventure-intro .adventure-primary").click();
    }
    await expect(page.getByTestId("adventure-summary")).toBeVisible();
    expect(await page.locator(".adventure-reward-grid button").count()).toBe(3);
    const reward = page.locator(".adventure-reward-grid button").first();
    await reward.click();
    await expect(reward).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: info.outputPath(`${game}-collection.png`) });
    await page
      .getByRole("button", { name: "חזרה לתפריט המשחקים", exact: true })
      .click();
    await openGame(
      page,
      {
        letters: "אותיות",
        numbers: "מספרים",
        shapes: "צורות",
        colors: "צבעים",
      }[game] as "אותיות",
    );
    await page.getByRole("button", { name: "האוסף שלי ✦" }).click();
    await expect(page.locator(".adventure-reward-grid button")).toHaveCount(3);
    await page.getByRole("button", { name: "עוד הרפתקאות" }).click();
    await expect(page.locator(".adventure-intro")).toBeVisible();
    const newId = await page
      .getByTestId("adventure")
      .getAttribute("data-mission");
    expect(ids).not.toContain(newId);
    guard();
  });

test("wrong answers, hints, double-submit and checkpoint survive reload", async ({
  page,
}) => {
  const m = adventureMissions.find((m) => m.id === "v2-number-breakfast")!;
  await openAdventure(page, m);
  await page.getByRole("button", { name: /מגישים/ }).dblclick();
  let data = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
        .dataByProfile["adventure-test"],
  );
  expect(data.events).toHaveLength(1);
  expect(data.events[0].correct).toBe(false);
  await page.getByRole("button", { name: "רמז", exact: true }).click();
  await solveMission(page, m);
  data = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
        .dataByProfile["adventure-test"],
  );
  expect(data.events[1].hintUsed).toBe(true);
  expect(data.events[1].attemptNumber).toBe(2);
  const expectedId = data.adventures.numbers.checkpoint.missionIds[1];
  await page.reload();
  await page.getByRole("button", { name: /מתחילים לשחק/ }).click();
  await openGame(page, "מספרים");
  await selectGameMode(page, "experience");
  await expect(page.getByTestId("adventure")).toHaveAttribute(
    "data-mission",
    expectedId,
  );
  const events = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
        .dataByProfile["adventure-test"].events,
  );
  expect(events).toHaveLength(3);
});

test("drag, outside release, cancellation and touch sizes", async ({
  page,
}) => {
  const m = adventureMissions.find((m) => m.id === "v2-number-breakfast")!;
  await openAdventure(page, m);
  const toy = page.locator('[data-toy="food"]');
  const plate = page.locator("[data-drop-zone]");
  const from = await toy.boundingBox(),
    to = await plate.boundingBox();
  expect(from!.width).toBeGreaterThanOrEqual(56);
  expect(from!.height).toBeGreaterThanOrEqual(56);
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.locator("[data-count]")).toHaveAttribute("data-count", "1");
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(3, 4, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator("[data-count]")).toHaveAttribute("data-count", "1");
  await toy.dispatchEvent("pointercancel", { pointerId: 1 });
  expect(await page.locator(".adventure-drag-ghost").count()).toBe(0);
  const events = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
        .dataByProfile["adventure-test"].events,
  );
  expect(events).toEqual([]);
});

test("rotation and paint are usable with taps and keyboard", async ({
  page,
}) => {
  const m = adventureMissions.find((m) => m.id === "v2-shape-windmill")!;
  await openAdventure(page, m);
  const step = missionSteps(m, { age: 4, difficulty: "medium" }, 137)[0];
  await page.locator(`[data-toy="${step.answer}"]`).focus();
  await page.keyboard.press("Enter");
  await page.locator("[data-drop-zone]").click();
  await expect(page.locator(".adventure-feedback")).toContainText("כמעט");
  await page.getByRole("button", { name: "סיבוב החלק ברבע סיבוב" }).click();
  await page.locator("[data-drop-zone]").click();
  await expect(page.getByTestId("adventure")).toHaveAttribute(
    "data-step",
    "piece-1",
  );
});

test("portrait and landscape preserve activity, reachable controls, accessibility", async ({
  page,
}, info) => {
  const m = adventureMissions.find((m) => m.id === "v2-color-orange")!;
  await openAdventure(page, m);
  const id = await page.getByTestId("adventure").getAttribute("data-step");
  const viewport = page.viewportSize()!;
  const flipped = { width: viewport.height, height: viewport.width };
  await page.setViewportSize(flipped);
  await expect
    .poll(() =>
      page
        .getByTestId("adventure")
        .evaluate((el) => Math.round(el.getBoundingClientRect().height)),
    )
    .toBe(flipped.height);
  await expect(page.getByTestId("adventure")).toHaveAttribute("data-step", id);
  for (const box of await page
    .locator(".adventure-tray button,.adventure-mix-actions button")
    .evaluateAll((nodes) =>
      nodes.map((n) => {
        const b = n.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      }),
    )) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(flipped.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(flipped.height + 1);
  }
  await page.screenshot({ path: info.outputPath("rotated-mixing.png") });
  const results = await new AxeBuilder({ page })
    .include(".adventure")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await solveMission(page, m);
});

test("application background pauses play and resumes without losing state", async ({
  page,
}) => {
  const m = adventureMissions.find((m) => m.id === "v2-number-breakfast")!;
  await openAdventure(page, m);
  await page.locator('[data-toy="food"]').click();
  await page.locator("[data-drop-zone]").click();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("lomdim:app-state", { detail: { isActive: false } }),
    ),
  );
  await expect(page.locator(".adventure-pause")).toBeVisible();
  await page.getByRole("button", { name: "ממשיכים לשחק", exact: true }).click();
  await expect(page.locator("[data-count]")).toHaveAttribute("data-count", "1");
});

test("LIFE-01: reload after one assembly stage resumes without duplicate evidence", async ({
  page,
}) => {
  const mission = adventureMissions.find((m) => m.id === "v2-letter-bridge")!;
  await openAdventure(page, mission);
  await page.locator('[data-toy="part-0"]').click();
  await page.locator("[data-drop-zone]").click();
  await page.reload();
  await page.getByRole("button", { name: /מתחילים לשחק/ }).click();
  await openGame(page, "אותיות");
  await selectGameMode(page, "experience");
  await expect(page.getByTestId("adventure")).toHaveAttribute(
    "data-step",
    "part-1",
  );
  const data = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
        .dataByProfile["adventure-test"],
  );
  expect(data.events).toHaveLength(1);
  expect(data.events[0].skillIds).toEqual(["motor.fine"]);
});
