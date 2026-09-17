import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { openAdventure } from "./adventure-helpers";

for (const game of ["letters", "numbers", "shapes", "colors"] as const)
  test(`${game}: scene has decoded art, readable controls and no overflow`, async ({
    page,
  }, info) => {
    await openAdventure(
      page,
      adventureMissions.find((m) => m.gameId === game)!,
    );
    await expect(page.locator('[data-toy]').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const image of await page
      .locator(".adventure img")
      .evaluateAll((images) =>
        images.map((image) => ({
          src: (image as HTMLImageElement).src,
          loaded:
            (image as HTMLImageElement).complete &&
            (image as HTMLImageElement).naturalWidth > 0,
        })),
      ))
      expect(image.loaded, image.src).toBe(true);
    const original = page.viewportSize()!;
    for (const viewport of [original, {width: original.height, height: original.width}]) {
      await page.setViewportSize(viewport);
      await expect.poll(() => page.getByTestId("adventure").evaluate(node => Math.round(node.getBoundingClientRect().height))).toBe(viewport.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
      const screenshot = await page.screenshot({path: info.outputPath(`${game}-${orientation}.png`)});
      await info.attach(`${game}-${orientation}`, {body: screenshot, contentType: "image/png"});
      const main = await page.getByTestId("adventure").boundingBox();
      expect(main!.height).toBeLessThanOrEqual(viewport.height + 1);
    }
  });
