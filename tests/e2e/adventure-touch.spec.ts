import { test, expect } from "@playwright/test";
import { adventureMissions } from "../../src/content/adventureMissions";
import { openAdventure } from "./adventure-helpers";

test("INT-01: browser touch protocol handles dragging, a second finger and tap alternatives", async ({
  page,
  context,
}) => {
  await openAdventure(
    page,
    adventureMissions.find((m) => m.id === "v2-number-breakfast")!,
  );
  const toy = (await page.locator('[data-toy="food"]').boundingBox())!,
    plate = (await page.locator("[data-drop-zone]").boundingBox())!;
  const client = await context.newCDPSession(page);
  const first = { id: 1, x: toy.x + toy.width / 2, y: toy.y + toy.height / 2 };
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [first],
  });
  const lifted = { ...first, y: first.y - 30 };
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [lifted],
  });
  await expect(page.locator(".adventure-drag-ghost")).toBeVisible();
  const second = { id: 2, x: toy.x + toy.width / 2 + 5, y: first.y };
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [lifted, second],
  });
  const target = {
    ...first,
    x: plate.x + plate.width / 2,
    y: plate.y + plate.height / 2,
  };
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [target, second],
  });
  // CDP input dispatch returns before React commits the next painted position.
  await expect.poll(async () => {
    const ghost = (await page.locator(".adventure-drag-ghost").boundingBox())!;
    return target.y - (ghost.y + ghost.height / 2);
  }).toBeGreaterThanOrEqual(60);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [second],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator("[data-count]")).toHaveAttribute("data-count", "1");
  await page.locator('[data-toy="food"]').tap();
  await page.locator("[data-drop-zone]").tap();
  await expect(page.locator("[data-count]")).toHaveAttribute("data-count", "2");
  const evidence = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("lomdim-bekef.learning.v4")!)
        .dataByProfile["adventure-test"].events,
  );
  expect(evidence).toHaveLength(0);
});
