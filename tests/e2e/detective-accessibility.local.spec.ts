import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import {
  bootDetective,
  enterDetective,
  finishDetective,
  solveDetectiveStep,
} from "./detective-helpers";
import numbers from "../../src/content/numbers.json" with { type: "json" };
import { newRound } from "../../src/components/games/detective/detectiveEngine";

test("large quantities remain distinct in narrow comparison and addition cards", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "local-chromium",
    "Additional narrow-layout check.",
  );
  await bootDetective(page, 6, "hard");
  const items = ["groups", "addition", "single"].map(
    (kind) =>
      numbers.items
        .filter(
          (item) =>
            item.ages[0] === 6 &&
            item.difficulty === "hard" &&
            item.scene.kind === kind,
        )
        .at(-1)!,
  );
  const round = newRound(
    items.map((item) => ({ gameId: "numbers", ids: [item.id] })),
    numbers.contentVersion,
    6,
    "hard",
  );
  await page.evaluate((round) => {
    const state = JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!);
    state.dataByProfile[state.activeProfileId].detectives = {
      rounds: { numbers: round },
      discoveries: [],
    };
    localStorage.setItem("lomdim-bekef.learning.v4", JSON.stringify(state));
  }, round);
  await enterDetective(page, "numbers");
  await page.addStyleTag({
    content:
      ".detective-card h2,.detective-answer-label{font-size:200%!important}",
  });
  for (const item of items) {
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 700 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const mark of await page
        .locator(".detective-quantity > span")
        .all()) {
        expect(
          await mark.evaluate(
            (element) =>
              element.getBoundingClientRect().width >=
              parseFloat(getComputedStyle(element).fontSize),
          ),
        ).toBe(true);
      }
      await page.screenshot({
        path: info.outputPath(`quantity-${item.scene.kind}-${width}.png`),
        fullPage: true,
      });
    }
    await solveDetectiveStep(page);
  }
});

test("all game boards fit small phones, landscape and tablets with large text", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "local-chromium",
    "Cross-engine coverage is in the session matrix; this case exercises four additional sizes.",
  );
  test.setTimeout(180_000);
  await bootDetective(page, 6, "hard");
  for (const game of [
    "letters",
    "numbers",
    "shapes",
    "colors",
    "patterns",
    "sorting",
    "matching",
    "memory",
  ] as const) {
    await enterDetective(page, game);
    for (const [width, height] of [
      [320, 568],
      [740, 360],
      [768, 1024],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${game} ${width}`,
      ).toBe(true);
      const targets = page.locator(".detective-answer,.detective-pair-card");
      for (const target of await targets.all()) {
        const box = await target.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(55.9);
        expect(box!.height).toBeGreaterThanOrEqual(55.9);
      }
      await page.screenshot({
        path: info.outputPath(`${game}-${width}x${height}.png`),
        fullPage: true,
      });
    }
    await page.addStyleTag({
      content:
        ".detective-card h2,.detective-answer-label{font-size:200%!important}",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "חזרה לתפריט", exact: true })
      .click();
  }
});

test("choice controls support keyboard, separate narration and non-color feedback", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "local-chromium",
    "Keyboard input is tested on desktop.",
  );
  await bootDetective(page, 4, "medium", true);
  await enterDetective(page, "letters");
  const readState = () =>
    page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!);
      return s.dataByProfile[s.activeProfileId];
    });
  await page.locator(".detective-option-audio").first().click();
  expect((await readState()).events).toHaveLength(0);
  const correct = page.locator('.detective-answer[data-correct="true"]');
  await correct.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".detective-feedback")).toContainText(
    "גיליתם בעצמכם",
  );
  expect((await readState()).events).toHaveLength(1);
  await page.keyboard.press("Enter");
  expect((await readState()).events).toHaveLength(1);
  const results = await new AxeBuilder({ page })
    .include(".detective-game")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("a second mistake keeps the question open until solved", async ({
  page,
}) => {
  await bootDetective(page, 4, "medium");
  await enterDetective(page, "letters");
  await page.locator('.detective-answer[data-correct="false"]').nth(0).click();
  await page.locator('.detective-answer[data-correct="false"]').nth(1).click();
  await expect(page.locator(".detective-chip")).toContainText("1/");
  await expect(
    page.locator('.detective-answer[data-correct="true"]'),
  ).toBeEnabled();
  await solveDetectiveStep(page);
  await finishDetective(page);
  const outcome = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!);
    return s.dataByProfile[s.activeProfileId].detectives.last;
  });
  expect(outcome.demonstrated).toBe(0);
  expect(outcome.assisted).toBeGreaterThan(0);
});

test("reload resumes completed activity and repairs an obsolete checkpoint", async ({
  page,
}) => {
  await bootDetective(page, 4, "medium");
  await enterDetective(page, "letters");
  await solveDetectiveStep(page);
  await page.reload({ waitUntil: "commit" });
  await page.getByRole("button", { name: /מתחילים לשחק/ }).click();
  await enterDetective(page, "letters");
  await expect(page.locator(".detective-chip")).toContainText("2/");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!);
    s.dataByProfile[
      s.activeProfileId
    ].detectives.rounds.letters.contentVersion = "obsolete";
    localStorage.setItem("lomdim-bekef.learning.v4", JSON.stringify(s));
  });
  await page.reload({ waitUntil: "commit" });
  await page.getByRole("button", { name: /מתחילים לשחק/ }).click();
  await enterDetective(page, "letters");
  await expect(page.locator(".detective-chip")).toContainText("1/");
});

test("rapid answer activations advance exactly one activity", async ({
  page,
}) => {
  await bootDetective(page, 4, "medium");
  await enterDetective(page, "letters");
  await page
    .locator('.detective-answer[data-correct="true"]')
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(page.locator(".detective-chip")).toContainText("2/");
  await expect(
    page.locator('.detective-answer[data-correct="true"]'),
  ).toBeEnabled();
});
