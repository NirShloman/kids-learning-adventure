import { test, expect } from "@playwright/test";
import {
  adventureMissions,
  alphabet,
} from "../../src/content/adventureMissions";
import { openAdventure } from "./adventure-helpers";

for (const [letter] of alphabet)
  test(`LET-01 ${letter}: each assembly piece contains visible ink`, async ({
    page,
  }, info) => {
    const mission = adventureMissions.find(
      (m) => m.activity === "letter-build" && m.letterSet?.includes(letter),
    )!;
    const seed = mission.letterSet!.indexOf(letter);
    await openAdventure(page, mission, 4, "medium", {}, seed);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".adventure-tray .adventure-letter")).toHaveCount(
      3,
    );
    // Rasterize the actual glyph and clip rectangles using the same loaded font.
    // This detects blank pieces, which a solvable-answer test cannot detect.
    const ink = await page
      .locator(".adventure-tray .adventure-letter")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const clip = node.querySelector("clipPath rect")!,
            text = node.querySelector("text")!;
          const canvas = document.createElement("canvas");
          canvas.width = 180;
          canvas.height = 180;
          const ctx = canvas.getContext("2d")!;
          ctx.beginPath();
          ctx.rect(
            Number(clip.getAttribute("x")),
            Number(clip.getAttribute("y")),
            Number(clip.getAttribute("width")),
            Number(clip.getAttribute("height")),
          );
          ctx.clip();
          ctx.font = "800 156px Rubik";
          ctx.textAlign = "center";
          ctx.fillText(text.textContent!, 90, 139);
          const data = ctx.getImageData(0, 0, 180, 180).data;
          let count = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i] > 64) count++;
          return count;
        }),
      );
    expect(ink).toHaveLength(3);
    for (const count of ink) expect(count, letter).toBeGreaterThan(30);
    await page.screenshot({
      path: info.outputPath(`letter-${seed}-${mission.variant}.png`),
    });
  });
