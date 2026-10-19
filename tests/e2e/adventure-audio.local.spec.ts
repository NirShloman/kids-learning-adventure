import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { openAdventure } from "./adventure-helpers";
import { openGame, selectGameMode } from "./helpers";

test("AUDIO-01: real packaged narration plays, repeats without overlap and respects mute", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const audios = new Set<HTMLMediaElement>();
    const probe = { plays: 0, overlaps: 0, decoded: 0, maxSimultaneous: 0, overlapDetails: [] as unknown[] };
    (window as any).__adventureAudio = probe;
    setInterval(() => {
      probe.maxSimultaneous = Math.max(probe.maxSimultaneous, [...audios].filter(audio => !audio.paused && !audio.ended).length);
    }, 16);
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes("/audio/narration/")) {
        audios.add(this);
        this.addEventListener(
          "playing",
          () => {
            // Media events are queued; a stopped element can deliver an old
            // event after a new recording begins. Count active playback only.
            if (this.paused || this.ended) return;
            probe.plays++;
            if (this.readyState >= 2) probe.decoded++;
            if (
              [...audios].some(
                (audio) => audio !== this && !audio.paused && !audio.ended,
              )
            ) {
              probe.overlaps++;
              probe.overlapDetails.push({ currentPaused: this.paused, currentEnded: this.ended, currentTime: this.currentTime, others: [...audios].filter(audio => audio !== this && !audio.paused && !audio.ended).map(audio => ({ paused: audio.paused, ended: audio.ended, currentTime: audio.currentTime })) });
            }
          },
          { once: true },
        );
      }
      return original.call(this);
    };
  });
  await openAdventure(
    page,
    adventureMissions.find((m) => m.id === "v2-number-breakfast")!,
  );
  await page.evaluate(() => {
    const key = "lomdim-bekef.learning.v4",
      snapshot = JSON.parse(localStorage.getItem(key)!);
    snapshot.profiles[0].narrationEnabled = true;
    localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.reload();
  await page.getByRole("button", { name: /מתחילים לשחק/ }).click();
  await openGame(page, "מספרים");
  await selectGameMode(page, "experience");
  await page.locator(".adventure-intro .adventure-primary").click();
  await page.getByRole("button", { name: "השמעת ההוראה" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__adventureAudio.decoded))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "רמז", exact: true }).click();
  await page.getByRole("button", { name: "השמעת ההוראה" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__adventureAudio.plays))
    .toBeGreaterThan(1);
  await info.attach("audio-overlap-diagnostics.json", { body: JSON.stringify(await page.evaluate(() => (window as any).__adventureAudio)), contentType: "application/json" });
  expect(
    await page.evaluate(() => (window as any).__adventureAudio.overlaps),
  ).toBe(0);
  expect(await page.evaluate(() => (window as any).__adventureAudio.maxSimultaneous)).toBeLessThanOrEqual(1);
  await page
    .getByRole("button", { name: "חזרה לתפריט המשחקים", exact: true })
    .click();
  // The styled switch exposes its label as the touch target; the native input
  // is visually hidden beneath that label on compact layouts.
  await page.getByRole('button', { name: '⚙️ צלילים' }).click();
  await page.locator('#learner-voice').uncheck();
  await expect(page.locator("#learner-voice")).not.toBeChecked();
  const before = await page.evaluate(
    () => (window as any).__adventureAudio.plays,
  );
  await page.getByRole('button', { name: '🎲 משחקים' }).click();
  await openGame(page, "מספרים");
  await selectGameMode(page, "experience");
  await page.locator(".adventure-intro .adventure-primary").click();
  await page.getByRole("button", { name: "השמעת ההוראה" }).click();
  expect(
    await page.evaluate(() => (window as any).__adventureAudio.plays),
  ).toBe(before);
  await info.attach("audio-playback.json", {
    body: JSON.stringify(
      await page.evaluate(() => (window as any).__adventureAudio),
    ),
    contentType: "application/json",
  });
});
