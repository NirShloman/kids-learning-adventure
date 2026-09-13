import { test, expect } from "@playwright/test";
// Page-level fault injection must reach the network rather than a service-worker
// cache. Production caching is exercised by the separate offline scenarios.
test.use({ serviceWorkers: "block" });
import AxeBuilder from "@axe-core/playwright";
import { adventureMissions } from "../../src/content/adventureMissions";
import { missionSteps } from "../../src/components/games/experience/adventureEngine";
import { openAdventure, openAdventureIntro } from "./adventure-helpers";
import { installConsoleErrorGuard } from "./helpers";

test("COL-01: finger paint stays clipped, survives cancellation and requires a choice", async ({
  page,
}) => {
  const guard = installConsoleErrorGuard(page);
  const mission = adventureMissions.find((m) => m.id === "v2-color-wings")!;
  await openAdventure(page, mission);
  const step = missionSteps(mission, { age: 4, difficulty: "medium" }, 137)[0];
  await page.locator(`[data-toy="${step.answer}"]`).click();
  await page.locator("[data-drop-zone]").click();
  const canvas = page.locator("canvas.adventure-paint-canvas");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.mouse.down();
  for (let row = 3; row <= 7; row++)
    for (let col = 3; col <= 7; col++)
      await page.mouse.move(
        box.x + (box.width * col) / 10,
        box.y + (box.height * row) / 10,
      );
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "סיימתי לצבוע" }),
  ).toBeVisible();
  const pixels = await canvas.evaluate((node: HTMLCanvasElement) => {
    const ctx = node.getContext("2d")!;
    return {
      outside: [...ctx.getImageData(0, 0, 1, 1).data],
      inside: [...ctx.getImageData(300, 300, 1, 1).data],
    };
  });
  expect(pixels.outside[3]).toBe(0);
  expect(pixels.inside[3]).toBe(255);
  await canvas.dispatchEvent("pointercancel", { pointerId: 1 });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
          .dataByProfile["adventure-test"].events.length,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "סיימתי לצבוע" }).click();
  await expect(page.getByTestId("adventure")).toHaveAttribute(
    "data-step",
    "color-1",
  );
  guard();
});

test("INT-01: extra pointer does not cancel the active drag; resizing does", async ({
  page,
}) => {
  const guard = installConsoleErrorGuard(page);
  await openAdventure(
    page,
    adventureMissions.find((m) => m.id === "v2-number-breakfast")!,
  );
  const toy = page.locator('[data-toy="food"]'),
    box = (await toy.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x, box.y - 45, { steps: 4 });
  await expect(page.locator(".adventure-drag-ghost")).toBeVisible();
  await toy.dispatchEvent("pointerdown", {
    pointerId: 777,
    isPrimary: false,
    button: 0,
  });
  await toy.dispatchEvent("pointercancel", {
    pointerId: 777,
    isPrimary: false,
  });
  await expect(page.locator(".adventure-drag-ghost")).toBeVisible();
  const viewport = page.viewportSize()!;
  await page.setViewportSize({
    width: viewport.height,
    height: viewport.width,
  });
  await expect(page.locator(".adventure-drag-ghost")).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator("[data-count]")).toHaveAttribute("data-count", "0");
  guard();
});

test("ERR-01: unavailable artwork offers a working retry", async ({ page }) => {
  let broken = true;
  await page.route("**/assets/experience/v2/numbers.webp", (route) =>
    broken ? route.abort() : route.continue(),
  );
  await openAdventureIntro(
    page,
    adventureMissions.find((m) => m.id === "v2-number-breakfast")!,
  );
  // Start the recovery assertion after navigation, and allow the loader's
  // 15-second fallback deadline if WebKit delays the image error callback.
  await expect(page.getByText("חלק מהתמונות עדיין לא נטענו.")).toBeVisible({timeout: 20_000});
  broken = false;
  await page.getByRole("button", { name: "ננסה שוב", exact: true }).click();
  await page.locator(".adventure-intro .adventure-primary").click();
  await expect(page.locator('[data-toy="food"]')).toBeVisible();
});

for (const id of [
  "v2-letter-bridge",
  "v2-number-breakfast",
  "v2-shape-windmill",
  "v2-color-petals",
  "v2-color-orange",
])
  test(`A11Y-01 INT-03: ${id} accessible with enlarged controls in both orientations`, async ({
    page,
  }) => {
    const guard = installConsoleErrorGuard(page);
    await openAdventure(
      page,
      adventureMissions.find((m) => m.id === id)!,
      6,
      "hard",
      { largeTouchTargets: true, highContrast: true, strongGuidance: true },
    );
    if (id === "v2-number-breakfast") {
      await page.locator('[data-toy="food"]').click();
      await page.locator("[data-drop-zone]").click();
    }
    if (id === "v2-color-orange")
      for (const color of ["red", "yellow"]) {
        await page.locator(`[data-toy="${color}"]`).click();
        await page.locator("[data-drop-zone]").click();
      }
    const original = page.viewportSize()!;
    for (const viewport of [
      original,
      { width: original.height, height: original.width },
    ]) {
      await page.setViewportSize(viewport);
      await expect
        .poll(() =>
          page
            .getByTestId("adventure")
            .evaluate((n) => Math.round(n.getBoundingClientRect().height)),
        )
        .toBe(viewport.height);
      const controls = page.locator(
        ".adventure-board button,.adventure-header button,.adventure-hint-button",
      );
      for (const control of await controls.all()) {
        const b = (await control.boundingBox())!;
        // Firefox/Linux can report a 56px transformed box as 55.999969px.
        // Compare at 0.001 CSS-pixel precision, retaining the 56px minimum.
        expect(Number(b.width.toFixed(3))).toBeGreaterThanOrEqual(56);
        expect(Number(b.height.toFixed(3))).toBeGreaterThanOrEqual(56);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(b.y + b.height).toBeLessThanOrEqual(viewport.height + 1);
        // Disabled controls deliberately use pointer-events:none. Measure their size,
        // but test hit reachability only when the control can perform an action.
        if (await control.isEnabled())
          expect(
            await control.evaluate((n) => {
              const b = n.getBoundingClientRect();
              const hit = document.elementFromPoint(
                b.x + b.width / 2,
                b.y + b.height / 2,
              );
              return n === hit || n.contains(hit);
            }),
            (await control.getAttribute("aria-label")) ??
              (await control.innerText()),
          ).toBe(true);
      }
      const results = await new AxeBuilder({ page })
        .include(".adventure")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
    guard();
  });
