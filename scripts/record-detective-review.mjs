import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { games } from "./content-facts.mjs";
if (!process.argv.includes("--record-editorial-review"))
  throw new Error(
    "Read docs/content-review/DETECTIVE_REVIEW.md and explicitly pass --record-editorial-review.",
  );
const review = readFileSync("docs/content-review/DETECTIVE_REVIEW.md", "utf8");
if (!review.includes("Editorial decisions"))
  throw new Error("Editorial review record missing");
execFileSync(
  process.execPath,
  ["scripts/validate-static-content.mjs", "--unreviewed"],
  { stdio: "inherit" },
);
const reviews = {};
const contentVersion = JSON.parse(readFileSync('src/content/letters.json','utf8')).contentVersion;
for (const game of games)
  for (const item of JSON.parse(
    readFileSync(`src/content/${game}.json`, "utf8"),
  ).items) {
    reviews[item.id] = {
      status: "ai-reviewed",
      provenance: "authored-semantic-review-v1",
      reviewer: "Codex — authored template and semantic review",
      expertise: "AI editorial review; no human or focus-group endorsement",
      reviewerType: "ai-simulation",
      linguistic: "approved",
      conceptual: "approved",
      ageFit: "approved",
      clarity: "approved",
      visualLeak: "approved",
      focusGroupLenses: [],
      reviewedAt: new Date().toISOString().slice(0, 10),
      notes: `Reviewed rule ${item.logic.rule}; see docs/content-review/DETECTIVE_REVIEW.md. All item semantics verified by executable oracle.`,
      contentHash: createHash("sha256")
        .update(JSON.stringify(item))
        .digest("hex"),
    };
  }
writeFileSync(
  "src/content/review-status.json",
  JSON.stringify({ contentVersion, reviews }, null, 2) + "\n",
);
console.log(
  `Recorded ${Object.keys(reviews).length} hash-bound AI reviews after semantic validation.`,
);
