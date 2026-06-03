import { mkdirSync, writeFileSync } from 'node:fs';
import { checkDuplicateQuestions, readSeedQuestions } from './content-quality.mjs';

const questions = readSeedQuestions();
const matches = checkDuplicateQuestions(questions);
const duplicates = matches.filter((match) => match.isDuplicate);
const similar = matches.filter((match) => match.isSimilar);

mkdirSync('reports', { recursive: true });
writeFileSync('reports/duplicate-summary.json', `${JSON.stringify({
  checkedAt: new Date().toISOString(),
  total: questions.length,
  duplicateCount: duplicates.length,
  similarCount: similar.length,
  matches
}, null, 2)}\n`, 'utf8');

console.log(`Checked ${questions.length} seed questions for duplicates.`);
console.log(`Duplicates: ${duplicates.length}; similar: ${similar.length}.`);

if (duplicates.length) {
  duplicates.slice(0, 50).forEach((match) => console.error(`${match.questionId}: ${match.reason} ${match.similarityScore}`));
  process.exitCode = 1;
}
