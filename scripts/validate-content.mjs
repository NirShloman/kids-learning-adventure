import { validateQuestions, readSeedQuestions } from './content-quality.mjs';

const questions = readSeedQuestions();
const result = validateQuestions(questions);

console.log(`Validated ${questions.length} seed questions.`);

if (!result.valid) {
  console.error(`Content validation failed with ${result.errors.length} issue(s).`);
  result.errors.slice(0, 80).forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log('Content validation passed.');
}
