import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { gameDefinitions } from '../src/data/games';
import { gameInstructions } from '../src/data/gameInstructions';
import { fixedNarrationEntries } from '../src/assets/narrationManifest';
import { adventureMissions } from '../src/content/adventureMissions';
import { missionSteps, itemLabel } from '../src/components/games/experience/adventureEngine';
import { calculateStars, getStarMessage } from '../src/utils/helpers';
import { normalizeHebrewNarration } from '../functions/src/narration/core';
import { toNarrationText } from '../src/utils/narrationText';

interface CatalogEntry {
  id: string;
  sourceType: 'content' | 'interface' | 'feedback' | 'experience' | 'dynamic';
  sourceId: string;
  sourceText: string;
  sources?: Array<{ sourceType: CatalogEntry['sourceType']; sourceId: string }>;
}

const root = resolve(import.meta.dirname, '..');
const outputFlag = process.argv.indexOf('--output');
const outputPath = outputFlag >= 0 && process.argv[outputFlag + 1]
  ? resolve(process.argv[outputFlag + 1])
  : join(root, 'tmp', 'narration', 'catalog.json');
const entries: CatalogEntry[] = [];
const ids = new Set<string>();

function add(sourceType: CatalogEntry['sourceType'], sourceId: string, text: unknown): void {
  if (typeof text !== 'string') return;
  const sourceText = normalizeHebrewNarration(toNarrationText(text));
  if (!sourceText) return;
  const safeSourceId = sourceId.replace(/[^A-Za-z0-9._-]/g, '-');
  const suffix = createHash('sha256').update(sourceText).digest('hex').slice(0, 10);
  let id = `${sourceType}.${safeSourceId}.${suffix}`;
  let duplicate = 1;
  while (ids.has(id)) id = `${sourceType}.${safeSourceId}.${suffix}.${duplicate++}`;
  ids.add(id);
  entries.push({ id, sourceType, sourceId, sourceText });
}

const contentFiles = ['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting'] as const;
for (const gameId of contentFiles) {
  const envelope = JSON.parse(readFileSync(join(root, 'src', 'content', `${gameId}.json`), 'utf8')) as {
    items: Array<Record<string, unknown> & { id: string; options?: Array<{ id: string; label: string }> }>;
  };
  const instruction = gameInstructions[gameId].intro;
  for (const item of envelope.items) {
    const prompt = item.audioText ?? item.prompt;
    add('content', `${gameId}.${item.id}.prompt`, prompt);
    if (typeof prompt === 'string') add('content', `${gameId}.${item.id}.first-prompt`, `${instruction} ${prompt}`);
    // Sorting's `item` is decorative emoji; the spoken binding is `itemName`.
    for (const field of ['right', 'leftValue', 'rightValue', 'itemName'] as const) {
      add('content', `${gameId}.${item.id}.${field}`, item[field]);
    }
    for (const option of item.options ?? []) {
      add('content', `${gameId}.${item.id}.option.${option.id}`, option.label);
      add('dynamic', `${gameId}.${item.id}.hint.${option.id}`, `רמז: התשובה היא ${option.label}`);
    }
  }
}

const experiences = JSON.parse(readFileSync(join(root, 'src', 'content', 'experiences.json'), 'utf8')) as Array<{
  id: string;
  title: string;
  instruction: string;
  successText: string;
  required: number;
  entities: Array<{ id: string; label: string }>;
}>;
for (const level of experiences) {
  add('experience', `${level.id}.intro`, `${level.title}. ${level.instruction}`);
  add('experience', `${level.id}.instruction`, level.instruction);
  add('experience', `${level.id}.success`, level.successText);
  for (const entity of level.entities) add('experience', `${level.id}.entity.${entity.id}`, entity.label);
  for (let progress = 1; progress <= level.required; progress += 1) {
    add('dynamic', `${level.id}.progress.${progress}`, `${progress} מתוך ${level.required}.`);
  }
}

for (const game of gameDefinitions) {
  const instruction = gameInstructions[game.id];
  add('interface', `game.${game.id}.title`, instruction.title);
  add('interface', `game.${game.id}.hover`, instruction.hoverText);
  add('interface', `game.${game.id}.intro`, instruction.intro);
  add('interface', `game.${game.id}.start`, `מתחילים את ${game.title}`);
  add('interface', `game.${game.id}.entry`, `עכשיו משחקים ב${game.id === 'sorting' ? 'מיון ובסיווג' : game.title}.`);
  if (['letters', 'numbers', 'shapes', 'colors'].includes(game.id)) {
    add('interface', `game.${game.id}.mode`, `איך תרצו לשחק ב${game.title}? אפשר לצאת להרפתקה, או לשחק בחידון.`);
  }
  for (const total of [3, 4, 5, 6, 7, 8, 9, 10]) {
    for (let score = 0; score <= total; score += 1) {
      const stars = calculateStars(score, total);
      add('dynamic', `summary.${game.id}.${score}.${total}.${stars}`, `סיימתם את ${game.title}. צברתם ${score} מתוך ${total}. קיבלתם ${stars} כוכבים. ${getStarMessage(stars)}`);
    }
  }
}

for (const mission of adventureMissions) {
  add('experience', `${mission.id}.intro`, `${mission.title}. ${mission.story}`);
  add('experience', `${mission.id}.story`, mission.story);
  add('experience', `${mission.id}.instruction`, mission.instruction);
  add('experience', `${mission.id}.reward`, `הצלחנו! ${mission.reward} נוספה לאוסף שלנו.`);
  const texts = new Set<string>();
  for (const age of [3, 4, 5, 6] as const) for (const difficulty of ['easy', 'medium', 'hard'] as const) for (let seed = 0; seed < 30; seed++) {
    for (const step of missionSteps(mission, { age, difficulty }, seed)) {
      texts.add(step.prompt); step.options.forEach(value => texts.add(itemLabel(value)));
    }
  }
  [...texts].forEach((text, index) => add('experience', `${mission.id}.step.${index}`, text));
}

for (const entry of fixedNarrationEntries) add(entry.category === 'feedback' ? 'feedback' : 'interface', entry.id, entry.text);

const sharedTexts = [
  'מתחילים לשחק ולגלות עם ידע׳לה.', 'מתחילים לשחק', 'חזרה לתפריט המשחקים', 'חזרה למסך הפתיחה',
  'משחק חווייתי, נוגעים במקום ובפריטים כדי לשחק', 'טריוויה, בוחרים את התשובה הנכונה',
  'לשחק שוב', 'לשאלה הבאה', 'לרצף הבא', 'לפריט הבא', 'כל הכבוד!', 'מצוין!', 'אלוף/ה!', 'מעולה!',
  'נהדר!', 'כמעט!', 'נסו שוב 😊', 'עוד רגע מצליחים!', 'בואו ננסה שוב!', 'כל הכבוד, מצאתם התאמה!',
  'כמעט, נסו שוב', 'מצוין, מצאתם זוג!', 'לא זוג, נסו לזכור איפה הקלפים היו.', 'כמעט, נסו צבע אחר.',
  'כמעט, נסו מקום אחר.', 'כמעט. ננסה בדרך אחרת.', 'ניסיון טוב — עכשיו ראינו את התשובה.'
];
sharedTexts.forEach((text, index) => add(index >= 9 ? 'feedback' : 'interface', `shared.${index}`, text));

for (const relativePath of readdirSync(join(root, 'src'), { recursive: true })) {
  if (typeof relativePath !== 'string' || !/\.(?:ts|tsx)$/.test(relativePath)) continue;
  const source = readFileSync(join(root, 'src', relativePath), 'utf8');
  const callPattern = /\b(?:speak|speakHebrew|playNarrationText|getSpeakProps(?:<[^>]+>)?)\(\s*(['"`])([^\n]*?)\1/g;
  for (const [index, match] of [...source.matchAll(callPattern)].entries()) {
    if (!match[2] || match[2].includes('${')) continue;
    add('interface', `source.${relativePath}.${index}`, match[2]);
  }
}

const byText = new Map<string, CatalogEntry[]>();
for (const entry of entries) byText.set(entry.sourceText, [...(byText.get(entry.sourceText) ?? []), entry]);
const catalogEntries: CatalogEntry[] = [...byText.entries()].map(([sourceText, references]) => ({
  id: `text.${createHash('sha256').update(sourceText).digest('hex')}`,
  sourceType: references[0]!.sourceType,
  sourceId: references[0]!.sourceId,
  sourceText,
  sources: references.map(({ sourceType, sourceId }) => ({ sourceType, sourceId }))
})).sort((first, second) => first.id.localeCompare(second.id));
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), entries: catalogEntries }, null, 2)}\n`);
console.log(`Narration catalog: ${catalogEntries.length} unique bindings from ${entries.length} source references -> ${outputPath}`);
