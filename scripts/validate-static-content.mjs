import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';

const games = ['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting'];
const ages = [3, 4, 5, 6];
const difficulties = ['easy', 'medium', 'hard'];
const directFamilies = new Set(['letter-direct', 'numeral-direct', 'shape-direct', 'color-direct']);
const targetAge = { 'hebrew.letter-sound': 4, 'hebrew.sound-position': 4, 'hebrew.first-words': 4, 'cognition.problem-solving': 4, 'readiness.grade-one': 5 };
const errors = [];
const schema = JSON.parse(readFileSync('src/content/content-envelope.schema.json', 'utf8'));
const reviewFile = JSON.parse(readFileSync('src/content/review-status.json', 'utf8'));
const validateEnvelope = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const allItems = [];
const ids = new Set();
const semanticSignatures = new Set();

function normalize(value) { return String(value ?? '').normalize('NFKD').replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
function optionFor(item) { return item.options?.find((option) => option.id === item.correctOptionId); }
function signature(gameId, item) { return createHash('sha256').update(`${gameId}:${item.taskFamily}:${item.conceptKey}:${item.variantKey}`).digest('hex'); }
function validateOptions(item) {
  if (!Array.isArray(item.options) || item.options.length !== 3) return errors.push(`${item.id}: exactly three options are required`);
  if (!optionFor(item)) errors.push(`${item.id}: correctOptionId does not exist`);
  const labels = item.options.map((option) => normalize(option.label));
  if (new Set(labels).size !== labels.length) errors.push(`${item.id}: duplicate option labels`);
}
function visualOverlapsAnswer(item) { const correct = optionFor(item); return Boolean(correct && item.visual && (normalize(item.visual) === normalize(correct.label) || item.visual === correct.emoji)); }
function validateItem(gameId, item) {
  if (ids.has(item.id)) errors.push(`${item.id}: duplicate global id`); ids.add(item.id); allItems.push({ gameId, item });
  if (!/^([a-z]+)-a[3-6]-(easy|medium|hard)-\d{3}$/.test(item.id)) errors.push(`${item.id}: invalid v2 id`);
  if (!Array.isArray(item.ages) || item.ages.length !== 1 || !ages.includes(item.ages[0])) errors.push(`${item.id}: item must have one supported age`);
  if (!difficulties.includes(item.difficulty)) errors.push(`${item.id}: invalid difficulty`);
  for (const key of ['taskFamily', 'conceptKey', 'variantKey']) if (!item[key]?.trim()) errors.push(`${item.id}: ${key} is required`);
  if (!['stimulus', 'context', 'direct-match', 'none'].includes(item.visualRole)) errors.push(`${item.id}: invalid visualRole`);
  if (item.visualRole === 'direct-match' && (item.difficulty !== 'easy' || !directFamilies.has(item.taskFamily))) errors.push(`${item.id}: direct match is allowed only for easy recognition`);
  if (item.difficulty !== 'easy' && visualOverlapsAnswer(item)) errors.push(`${item.id}: medium/hard visual reveals the answer`);
  if (!Array.isArray(item.skillIds) || !item.skillIds.length) errors.push(`${item.id}: skillIds are required`);
  for (const skillId of item.skillIds ?? []) if (item.ages[0] < (targetAge[skillId] ?? 3)) errors.push(`${item.id}: ${skillId} is outside its target age`);
  const itemSignature = signature(gameId, item); if (semanticSignatures.has(itemSignature)) errors.push(`${item.id}: duplicate semantic challenge`); semanticSignatures.add(itemSignature);
  if (['letters', 'numbers', 'shapes', 'colors'].includes(gameId)) { validateOptions(item); if (item.category !== gameId || !item.prompt?.trim() || !item.audioText?.trim()) errors.push(`${item.id}: invalid quiz payload`); }
  if (gameId === 'patterns') { validateOptions(item); if (!Array.isArray(item.sequence) || item.sequence.filter((value) => value === '?').length !== 1) errors.push(`${item.id}: pattern needs exactly one missing item`); }
  if (gameId === 'sorting') { validateOptions(item); if (!item.item?.trim() || !item.itemName?.trim()) errors.push(`${item.id}: sorting item is incomplete`); }
  if (gameId === 'matching' && (!item.left?.trim() || !item.right?.trim())) errors.push(`${item.id}: matching pair is incomplete`);
  if (gameId === 'memory' && (!item.leftValue?.trim() || !item.rightValue?.trim())) errors.push(`${item.id}: memory pair is incomplete`);
}

for (const gameId of games) {
  const file = JSON.parse(readFileSync(`src/content/${gameId}.json`, 'utf8'));
  if (!validateEnvelope(file)) { errors.push(`${gameId}: ${validateEnvelope.errors?.map((error) => error.message).join(', ')}`); continue; }
  if (file.gameId !== gameId || file.contentVersion !== reviewFile.contentVersion) errors.push(`${gameId}: invalid envelope metadata`);
  if (file.items.length !== 480) errors.push(`${gameId}: expected 480 items, found ${file.items.length}`);
  file.items.forEach((item) => validateItem(gameId, item));
  for (const age of ages) for (const difficulty of difficulties) { const cell = file.items.filter((item) => item.ages[0] === age && item.difficulty === difficulty); if (cell.length !== 40) errors.push(`${gameId}: expected 40 items for age ${age}, ${difficulty}; found ${cell.length}`); }
}

const reviewIds = Object.keys(reviewFile.reviews ?? {});
if (reviewIds.length !== ids.size) errors.push(`review-status: expected ${ids.size} records, found ${reviewIds.length}`);
for (const { item } of allItems) {
  const review = reviewFile.reviews[item.id]; if (!review) continue;
  const hash = createHash('sha256').update(JSON.stringify(item)).digest('hex');
  if (review.contentHash !== hash) errors.push(`${item.id}: review hash does not match content`);
  if (review.status !== 'ai-reviewed' || review.reviewerType !== 'ai-simulation' || review.provenance !== 'synthetic-focus-group-v1') errors.push(`${item.id}: transparent AI review is required`);
  if (review.linguistic !== 'approved' || review.conceptual !== 'approved' || review.ageFit !== 'approved' || review.clarity !== 'approved' || review.visualLeak !== 'approved' || !Array.isArray(review.focusGroupLenses)) errors.push(`${item.id}: review gates are incomplete`);
}
if (errors.length) { console.error(`Static content validation failed with ${errors.length} issue(s).`); errors.slice(0, 120).forEach((error) => console.error(error)); process.exitCode = 1; }
else { console.log(`Validated ${allItems.length} AI-reviewed static content items across ${games.length} games.`); games.forEach((gameId) => console.log(`${gameId}: 480`)); }
