import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { adventureMissions, alphabet } from "../src/content/adventureMissions";
import {
  missionSteps,
  isCorrectAction,
  quantityLimit,
} from "../src/components/games/experience/adventureEngine";
import type { Age, Difficulty } from "../src/types";

const errors: string[] = [];
const check = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};
check(adventureMissions.length === 48, "Expected 48 authored missions");
check(
  new Set(adventureMissions.map((m) => m.id)).size === 48,
  "Mission IDs must be unique",
);
for (const game of ["letters", "numbers", "shapes", "colors"]) {
  const missions = adventureMissions.filter((m) => m.gameId === game);
  check(missions.length === 12, `${game}: expected 12 missions`);
  const families = [...new Set(missions.map((m) => m.activity))];
  check(families.length === 3, `${game}: expected three mechanics`);
  for (const activity of families)
    check(
      missions.filter((m) => m.activity === activity).length === 4,
      `${activity}: expected four stories`,
    );
}
const seenLetters = new Set<string>();
let scenarios = 0;
for (const mission of adventureMissions)
  for (const age of [3, 4, 5, 6] as Age[])
    for (const difficulty of ["easy", "medium", "hard"] as Difficulty[])
      for (let seed = 0; seed < 30; seed++) {
        const settings = { age, difficulty };
        const steps = missionSteps(mission, settings, seed);
        scenarios++;
        check(steps.length >= 2, `${mission.id}: missing learning sequence`);
        check(
          new Set(steps.map((s) => s.id)).size === steps.length,
          `${mission.id}: duplicate step IDs`,
        );
        for (const step of steps) {
          check(
            isCorrectAction(step, step.answer, 0),
            `${mission.id}/${step.id}: answer is unreachable`,
          );
          if (
            step.kind === "choose" ||
            step.kind === "place" ||
            step.kind === "paint"
          )
            check(
              step.options.includes(step.answer),
              `${mission.id}/${step.id}: missing answer choice`,
            );
          if (step.kind === "count")
            check(
              (step.count ?? 0) <= quantityLimit(settings) &&
                (step.initial ?? 0) < (step.count ?? 0),
              `${mission.id}/${step.id}: unsafe count`,
            );
          if (mission.gameId === "letters" && step.kind === "choose")
            seenLetters.add(step.answer);
        }
      }
check(
  alphabet.every(([letter]) => seenLetters.has(letter)),
  "All 22 regular letters must be reachable",
);
const manifest = JSON.parse(
  readFileSync("src/content/adventure-assets.json", "utf8"),
);
for (const asset of manifest.assets) {
  const file = join("public", asset.path);
  if (!existsSync(file)) {
    errors.push(`Missing ${file}`);
    continue;
  }
  const metadata = await sharp(file).metadata();
  check(
    metadata.width === asset.width && metadata.height === asset.height,
    `${asset.id}: dimensions mismatch`,
  );
  check(
    statSync(file).size < 1_000_000,
    `${asset.id}: runtime asset exceeds 1 MB`,
  );
  if (asset.kind === "cutout")
    check(metadata.hasAlpha, `${asset.id}: missing real alpha`);
}
if (errors.length) {
  console.error(errors.slice(0, 30).join("\n"));
  process.exit(1);
}
console.log(
  `Validated ${adventureMissions.length} missions, ${scenarios} age/difficulty/seed scenarios, 22 letters and ${manifest.assets.length} assets.`,
);
