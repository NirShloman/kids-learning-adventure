import { describe, it, expect } from "vitest";
import { adventureMissions } from "../../src/content/adventureMissions";
import {
  missionSteps,
  itemLabel,
} from "../../src/components/games/experience/adventureEngine";
import { narrationAssetForText } from "../../src/assets/narrationManifest";
import { toNarrationText } from "../../src/utils/narrationText";

describe("packaged adventure narration", () => {
  it("has a real binding for every mission variant and option label", () => {
    const texts = new Set<string>();
    for (const mission of adventureMissions) {
      [
        mission.story,
        mission.instruction,
        `${mission.title}. ${mission.story}`,
        `הצלחנו! ${mission.reward} נוספה לאוסף שלנו.`,
      ].forEach((text) => texts.add(text));
      for (const age of [3, 4, 5, 6] as const)
        for (const difficulty of ["easy", "medium", "hard"] as const)
          for (let seed = 0; seed < 30; seed++) {
            for (const step of missionSteps(
              mission,
              { age, difficulty },
              seed,
            )) {
              texts.add(step.prompt);
              step.options.forEach((value) => texts.add(itemLabel(value)));
            }
          }
    }
    for (const text of texts) {
      const asset = narrationAssetForText(text);
      expect(asset, text).toBeDefined();
      expect(asset?.durationMs, text).toBeGreaterThan(100);
    }
  });
  it("gives symbols spoken names, including number quantities", () => {
    expect(toNarrationText("🔺")).toBe("משולש אדום");
    expect(toNarrationText("⭐⭐⭐")).toBe("שלושה כוכבים");
    expect(toNarrationText("קלף ⭐⭐⭐")).toBe("קלף שלושה כוכבים");
    expect(toNarrationText("רמז: התשובה היא 🔺")).toBe(
      "רמז: התשובה היא משולש אדום",
    );
  });
});
