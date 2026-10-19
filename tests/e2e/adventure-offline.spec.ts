import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { openAdventure, solveMission } from "./adventure-helpers";
import { openGame, selectGameMode } from "./helpers";

for (const game of ["letters", "numbers", "shapes", "colors"] as const)
  test(`OFF-01 ${game}: prepared production world and narration survive offline reload`, async ({
    page,
    context,
  }, info) => {
    const mission = adventureMissions.find((m) => m.gameId === game)!;
    await openAdventure(page, mission);
    await page.evaluate(() => navigator.serviceWorker.ready);
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
    await page.locator(".offline-menu > summary").click();
    await page
      .getByRole("button", { name: "שמירה למשחק ללא רשת", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "המשחק מוכן גם ללא רשת" }),
    ).toBeVisible({ timeout: 120_000 });
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: /מתחילים לשחק/ }).click();
    await openGame(
      page,
      {
        letters: "אותיות",
        numbers: "מספרים",
        shapes: "צורות",
        colors: "צבעים",
      }[game] as "אותיות",
    );
    await selectGameMode(page, "experience");
    await page.locator(".adventure-intro .adventure-primary").click();
    await solveMission(page, mission);
    const entries = await page.evaluate(async () => {
      let count = 0;
      for (const name of await caches.keys())
        for (const request of await (await caches.open(name)).keys())
          if (request.url.includes("/audio/narration/")) count++;
      return count;
    });
    expect(entries).toBeGreaterThan(20);
    await info.attach("offline-cache.json", {
      body: JSON.stringify({
        game,
        narrationFiles: entries,
        network: "offline",
        environment: "Chromium browser simulation",
      }),
      contentType: "application/json",
    });
  });
