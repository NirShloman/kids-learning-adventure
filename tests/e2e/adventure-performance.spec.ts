import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { openAdventure } from "./adventure-helpers";

test("PERF-01: active animation and pointer-to-painted-feedback measurements", async ({
  page,
}, info) => {
  await openAdventure(
    page,
    adventureMissions.find((m) => m.id === "v2-number-breakfast")!,
    4,
    "medium",
    { reducedMotion: false, reducedParticles: false },
  );
  const intervals = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        let last = 0;
        const frame = (now: number) => {
          if (last) samples.push(now - last);
          last = now;
          samples.length === 120
            ? resolve(samples)
            : requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
  await page.locator('[data-toy="food"]').click();
  const samples: number[] = [];
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      (window as any).__adventureLatency = new Promise<number>((resolve) => {
        const plate = document.querySelector("[data-drop-zone]")!;
        plate.addEventListener(
          "pointerdown",
          () => {
            const start = performance.now();
            const observer = new MutationObserver(() => {
              observer.disconnect();
              requestAnimationFrame(() => resolve(performance.now() - start));
            });
            observer.observe(document.querySelector("[data-count]")!, {
              attributes: true,
              attributeFilter: ["data-count"],
            });
          },
          { once: true },
        );
      });
    });
    await page.locator("[data-drop-zone]").click();
    samples.push(await page.evaluate(() => (window as any).__adventureLatency));
    await page.getByRole("button", { name: "החזרת פרי אחד" }).click();
  }
  const sorted = [...intervals].sort((a, b) => a - b),
    latency = [...samples].sort((a, b) => a - b);
  const result = {
    environment:
      `${process.platform} host, Chromium Pixel 5 viewport simulation; not a physical phone`,
    animationEnabled: true,
    frameSamples: intervals.length,
    medianFrameMs: sorted[60],
    p95FrameMs: sorted[114],
    meanFps: 1000 / (intervals.reduce((a, b) => a + b) / intervals.length),
    touchSamples: samples.length,
    maxTouchFeedbackMs: latency.at(-1),
    medianTouchFeedbackMs: latency[5],
  };
  await info.attach("performance.json", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
  expect(Math.max(...samples)).toBeLessThan(100);
  expect(sorted[60]).toBeLessThan(20);
});
