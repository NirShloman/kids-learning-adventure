/** Offline release asset preparation. Uses the existing configured voice and TTS gateway;
 * never enables, deploys or changes the automatic cloud generation service. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createHash } from 'node:crypto';
import { NarrationBudget } from './narration-budget.mts';
import { GoogleTextToSpeechGateway } from "../functions/src/narration/firebase-adapters";
import {
  DEFAULT_NARRATION_CONFIG,
  createNarrationAssetKey,
  narrationStoragePath,
  checksumAudio,
  validateNarrationText,
} from "../functions/src/narration/core";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(join(root, "functions/package.json"));
const { parseBuffer } = await import(
  pathToFileURL(require.resolve("music-metadata")).href
);
const catalog = JSON.parse(
  readFileSync(join(root, "tmp/narration/catalog.json"), "utf8"),
);
const manifestPath = join(root, "tmp/narration/local-generated-manifest.json");
const manifest = JSON.parse(
  readFileSync(
    existsSync(manifestPath)
      ? manifestPath
      : join(root, "src/assets/generatedNarrationManifest.json"),
    "utf8",
  ),
);
const config = DEFAULT_NARRATION_CONFIG;
const texts = [
  ...new Set<string>(
    catalog.entries.map((e: { sourceText: string }) =>
      validateNarrationText(e.sourceText),
    ),
  ),
];
const missing = texts.filter((text) => {
  const entry = manifest.entries[text];
  return (
    !entry ||
    entry.assetKey !== createNarrationAssetKey(text, config) ||
    !existsSync(join(root, "public", entry.localPath)) ||
    checksumAudio(readFileSync(join(root, "public", entry.localPath))) !==
      entry.checksum
  );
});
console.log(
  JSON.stringify({
    voice: config.voice,
    total: texts.length,
    missing: missing.length,
    characters: missing.reduce((n, t) => n + t.length, 0),
  }),
);
const requestFlag = process.argv.indexOf('--request-file');
if (requestFlag >= 0) {
  const output = process.argv[requestFlag + 1];
  if (!output || output.startsWith('--')) throw new Error('--request-file requires a path');
  const missingSet = new Set(missing);
  const characters = missing.reduce((sum, text) => sum + text.length, 0);
  mkdirSync(dirname(resolve(output)), {recursive: true});
  writeFileSync(output, JSON.stringify({
    voice: config.voice, date: new Date().toISOString().slice(0, 10),
    count: missing.length, characters, usdPerMillion: 30,
    estimatedUsdBeforeTax: characters * 30 / 1_000_000,
    pricingSource: 'https://cloud.google.com/text-to-speech/pricing',
    pricingChecked: '2026-09-14', approval: 'pending',
    entries: catalog.entries.filter((entry: {sourceText: string}) => missingSet.has(validateNarrationText(entry.sourceText)))
  }, null, 2) + '\n');
}
if (!process.argv.includes("--apply")) process.exit(0);
if (
  process.env.TTS_GENERATION_ENABLED !== "true" ||
  !process.argv.includes("--allow-generation")
)
  throw new Error(
    "Explicit generation consent is required: TTS_GENERATION_ENABLED=true and --allow-generation.",
  );
const maxUsdFlag = process.argv.indexOf('--max-usd');
const maxUsd = maxUsdFlag >= 0 ? Number(process.argv[maxUsdFlag + 1]) : NaN;
const approvalId = createHash('sha256').update(JSON.stringify({ config, texts: [...texts].sort() })).digest('hex');
const budget = new NarrationBudget(join(root, 'tmp/narration', `budget-${approvalId}.jsonl`), approvalId, maxUsd);
const paidCharacters = missing.reduce((sum, text) => {
  const path = join(root, 'public/assets/audio', narrationStoragePath(createNarrationAssetKey(text, config), config));
  return sum + (existsSync(path) ? 0 : text.length);
}, 0);
// Preflight the whole remaining batch before incurring any new cost.
budget.check(paidCharacters);
const gateway = new GoogleTextToSpeechGateway(undefined, true);
let cursor = 0,
  done = 0,
  failed: Error | undefined;
let nextStart = Date.now();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const persist = () => {
  const content =
    JSON.stringify(
      {
        ...manifest,
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        config,
        entries: Object.fromEntries(
          Object.entries(manifest.entries).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        ),
      },
      null,
      2,
    ) + "\n";
  // This is a resumable build checkpoint, separate from the release manifest.
  // Windows scanners can lock a destination briefly and reject rename-overwrite.
  // Keep a recovery copy before writing the checkpoint; publish only after validation.
  if (existsSync(manifestPath))
    writeFileSync(`${manifestPath}.backup`, readFileSync(manifestPath));
  writeFileSync(manifestPath, content);
};
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (!failed) {
      const index = cursor++;
      if (index >= missing.length) return;
      const text = missing[index],
        assetKey = createNarrationAssetKey(text, config),
        storagePath = narrationStoragePath(assetKey, config);
      const path = join(root, "public/assets/audio", storagePath);
      try {
        let audio: Buffer | undefined;
        if (existsSync(path)) audio = readFileSync(path);
        for (let attempt = 0; !audio && attempt < 3; attempt++) {
          const start = Math.max(Date.now(), nextStart);
          nextStart = start + 400;
          await delay(Math.max(0, start - Date.now()));
          if (failed) return;
          // Reserve synchronously before each request, including retries. The
          // durable ledger also counts uncertain attempts after a process restart.
          budget.reserve(assetKey, text.length);
          try {
            audio = Buffer.from(await gateway.synthesize(text, config));
          } catch (error) {
            if (attempt === 2) throw error;
            await delay(5000 * (attempt + 1));
          }
        }
        if (!audio?.length) throw new Error("Empty narration output");
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, audio);
        const metadata = await parseBuffer(
          audio,
          { mimeType: "audio/mpeg", path },
          { duration: true },
        );
        if (!(metadata.format.duration > 0))
          throw new Error("Invalid MP3 duration");
        manifest.entries[text] = {
          assetKey,
          storagePath,
          localPath: `/assets/audio/${storagePath}`,
          audioUrl: `/assets/audio/${storagePath}`,
          checksum: checksumAudio(audio),
          byteLength: audio.length,
          durationMs: Math.round(metadata.format.duration * 1000),
        };
        done++;
        persist();
        if (done % 25 === 0 || done === missing.length)
          console.log(`Recorded ${done}/${missing.length}`);
      } catch (error) {
        failed = error instanceof Error ? error : new Error(String(error));
        console.error(`Stopped at binding ${assetKey}: ${failed.message}`);
      }
    }
  }),
);
if (failed) throw failed;
console.log(`Local narration ready: ${texts.length} texts.`);
console.log(`Conservative generation cost reserved: USD ${budget.estimatedUsdReserved.toFixed(6)} before tax.`);
if (process.argv.includes("--publish")) {
  const release = {
    ...manifest,
    generatedAt: new Date().toISOString(),
    entries: Object.fromEntries(
      texts.map((text) => [text, manifest.entries[text]]),
    ),
  };
  writeFileSync(
    join(root, "src/assets/generatedNarrationManifest.json"),
    JSON.stringify(release, null, 2) + "\n",
  );
  console.log(
    `Published ${texts.length} validated local bindings to the release manifest.`,
  );
}
