import { mkdirSync, writeFileSync } from 'node:fs';
import { readSeedQuestions, reviewQuestions } from './content-quality.mjs';

const questions = readSeedQuestions();
const reviews = reviewQuestions(questions);
const rejected = reviews.filter((item) => !item.review.approved);

mkdirSync('reports', { recursive: true });
writeFileSync('reports/review-summary.json', `${JSON.stringify({
  reviewedAt: new Date().toISOString(),
  total: reviews.length,
  approved: reviews.length - rejected.length,
  rejected: rejected.length,
  reviews
}, null, 2)}\n`, 'utf8');

console.log(`Reviewed ${reviews.length} seed questions.`);

if (rejected.length) {
  console.error(`Review found ${rejected.length} question(s) that are not approved.`);
  rejected.slice(0, 50).forEach((item) => console.error(`${item.id}: ${item.review.finalRecommendation}`));
  process.exitCode = 1;
} else {
  console.log('Review passed.');
}
