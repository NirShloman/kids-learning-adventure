import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const games = ['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting'];
const ages = [3, 4, 5, 6];
const difficulties = ['easy', 'medium', 'hard'];
const targets = { letters: 180, numbers: 170, shapes: 110, colors: 110, matching: 120, memory: 100, patterns: 110, sorting: 110 };
const errors = [];
const schema = JSON.parse(readFileSync('src/content/content-envelope.schema.json', 'utf8'));
const reviewFile = JSON.parse(readFileSync('src/content/review-status.json', 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateEnvelope = ajv.compile(schema);
const allIds = new Set();
const allItems = [];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function optionFor(item) {
  return item.options?.find((option) => option.id === item.correctOptionId);
}

function validateOptions(gameId, item) {
  if (!Array.isArray(item.options) || item.options.length !== 3) {
    errors.push(`${item.id}: ${gameId} item must have exactly three options`);
    return;
  }
  if (!optionFor(item)) errors.push(`${item.id}: correctOptionId does not exist`);
  const ids = item.options.map((option) => option.id);
  const labels = item.options.map((option) => normalize(option.label));
  if (new Set(ids).size !== ids.length) errors.push(`${item.id}: duplicate option ids`);
  if (new Set(labels).size !== labels.length) errors.push(`${item.id}: duplicate option labels`);
}

function validateQuiz(gameId, item) {
  validateOptions(gameId, item);
  if (!/[\u0590-\u05FF]/.test(item.prompt ?? '')) errors.push(`${item.id}: prompt must contain Hebrew`);
  if (!item.audioText?.trim()) errors.push(`${item.id}: audioText is required`);
  if (!item.visual?.trim() && !item.imageAssetId) errors.push(`${item.id}: visual support is required`);
  if (item.category !== gameId) errors.push(`${item.id}: category must match ${gameId}`);

  const correct = Number(optionFor(item)?.label);
  if (gameId === 'numbers' && item.skill === 'early-addition') {
    const match = item.prompt.match(/(\d+) ועוד (\d+)/);
    if (!match || correct !== Number(match[1]) + Number(match[2])) errors.push(`${item.id}: invalid addition answer`);
  }
  if (gameId === 'numbers' && item.skill === 'number-sequence') {
    const match = item.prompt.match(/אחרי (\d+)/);
    if (!match || correct !== Number(match[1]) + 1) errors.push(`${item.id}: invalid next-number answer`);
  }
}

function validatePattern(item) {
  validateOptions('patterns', item);
  if (!Array.isArray(item.sequence) || item.sequence.at(-1) !== '?' || item.sequence.filter((value) => value === '?').length !== 1) {
    errors.push(`${item.id}: pattern must end with one question mark`);
    return;
  }
  const correct = optionFor(item)?.label;
  if (item.skill === 'ab-pattern' && correct !== item.sequence[0]) errors.push(`${item.id}: invalid AB answer`);
  if (item.skill === 'abc-pattern' && correct !== item.sequence[2]) errors.push(`${item.id}: invalid ABC answer`);
  if (item.skill === 'number-pattern') {
    const values = item.sequence.slice(0, -1).map(Number);
    const step = values[1] - values[0];
    if (values.some((value, index) => index > 0 && value - values[index - 1] !== step)) errors.push(`${item.id}: inconsistent numeric pattern`);
    if (Number(correct) !== values.at(-1) + step) errors.push(`${item.id}: invalid numeric pattern answer`);
  }
}

for (const gameId of games) {
  const file = JSON.parse(readFileSync(`src/content/${gameId}.json`, 'utf8'));
  if (!validateEnvelope(file)) {
    errors.push(`${gameId}: ${ajv.errorsText(validateEnvelope.errors)}`);
    continue;
  }
  if (file.gameId !== gameId) errors.push(`${gameId}: envelope gameId mismatch`);
  if (file.contentVersion !== reviewFile.contentVersion) errors.push(`${gameId}: content version differs from review status`);
  if (file.items.length !== targets[gameId]) errors.push(`${gameId}: expected ${targets[gameId]} items, found ${file.items.length}`);

  for (const item of file.items) {
    if (allIds.has(item.id)) errors.push(`${item.id}: duplicate global id`);
    allIds.add(item.id);
    allItems.push({ gameId, item });
    if (!reviewFile.reviews[item.id]) errors.push(`${item.id}: missing review status`);
    if (item.ages.some((age) => !ages.includes(age))) errors.push(`${item.id}: invalid age`);
    if (!difficulties.includes(item.difficulty)) errors.push(`${item.id}: invalid difficulty`);

    if (['letters', 'numbers', 'shapes', 'colors'].includes(gameId)) validateQuiz(gameId, item);
    if (gameId === 'patterns') validatePattern(item);
    if (gameId === 'sorting') {
      validateOptions(gameId, item);
      if (!item.item?.trim() || !item.itemName?.trim()) errors.push(`${item.id}: sorting item and name are required`);
    }
    if (gameId === 'matching' && (!item.left?.trim() || !item.right?.trim())) errors.push(`${item.id}: both matching sides are required`);
    if (gameId === 'memory' && !item.value?.trim()) errors.push(`${item.id}: memory value is required`);
  }

  for (const age of ages) {
    for (const difficulty of difficulties) {
      const count = file.items.filter((item) => item.ages.includes(age) && item.difficulty === difficulty).length;
      if (count < 15) errors.push(`${gameId}: only ${count} items for age ${age}, ${difficulty}`);
    }
  }
}

const reviewIds = Object.keys(reviewFile.reviews);
if (reviewIds.length !== allIds.size) errors.push(`review-status: expected ${allIds.size} records, found ${reviewIds.length}`);
for (const reviewId of reviewIds) {
  if (!allIds.has(reviewId)) errors.push(`${reviewId}: orphan review record`);
  const review = reviewFile.reviews[reviewId];
  if (review.linguistic !== 'approved' || review.conceptual !== 'approved' || review.ageFit !== 'approved') {
    errors.push(`${reviewId}: all three review gates must be approved`);
  }
}

const memoryValues = allItems.filter(({ gameId }) => gameId === 'memory').map(({ item }) => normalize(item.value));
if (new Set(memoryValues).size !== memoryValues.length) errors.push('memory: duplicate pair values found');

if (errors.length) {
  console.error(`Static content validation failed with ${errors.length} issue(s).`);
  errors.slice(0, 100).forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log(`Validated ${allIds.size} reviewed static content items across ${games.length} games.`);
  for (const gameId of games) {
    const count = allItems.filter((entry) => entry.gameId === gameId).length;
    console.log(`${gameId}: ${count}`);
  }
}
