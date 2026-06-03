import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { colorQuestions, letterQuestions, numberQuestions, shapeQuestions } from '../src/data/questions';
import { mapQuizQuestionToGameQuestion } from '../src/services/questions/questionProvider';
import { checkDuplicateQuestion } from '../src/services/contentReview/duplicateQuestionDetector';
import type { AgeRange, GameQuestion, QuizQuestion } from '../src/types';

const outputPath = 'shared-content/seed/questions.seed.json';
const targetTotal = Number(process.env.SEED_TARGET_TOTAL ?? 120);
const targetPerWorldAge = Number(process.env.SEED_TARGET_PER_WORLD_AGE ?? 10);

const sources: Array<{ worldId: QuizQuestion['category']; items: QuizQuestion[] }> = [
  { worldId: 'letters', items: letterQuestions },
  { worldId: 'numbers', items: numberQuestions },
  { worldId: 'shapes', items: shapeQuestions },
  { worldId: 'colors', items: colorQuestions }
];
const ageRanges: AgeRange[] = ['3-4', '4-5', '5-6'];
const seedQuestions: GameQuestion[] = [];

function addQuestion(quizQuestion: QuizQuestion): boolean {
  const mappedQuestion = mapQuizQuestionToGameQuestion(quizQuestion, seedQuestions.length);
  const duplicate = checkDuplicateQuestion(mappedQuestion, seedQuestions);
  if (duplicate.isDuplicate) return false;

  seedQuestions.push({
    ...mappedQuestion,
    version: 1,
    tags: [...new Set([
      ...mappedQuestion.tags,
      'trial-seed',
      'content-v1-trial-2026-06'
    ])]
  });
  return true;
}

for (const ageRange of ageRanges) {
  for (const source of sources) {
    let addedForGroup = 0;
    for (const quizQuestion of source.items) {
      if (seedQuestions.length >= targetTotal) break;
      const mappedQuestion = mapQuizQuestionToGameQuestion(quizQuestion, seedQuestions.length);
      if (mappedQuestion.worldId !== source.worldId || mappedQuestion.ageRange !== ageRange) continue;
      if (addQuestion(quizQuestion)) addedForGroup += 1;
      if (addedForGroup >= targetPerWorldAge) break;
    }
  }
}

for (const source of sources) {
  for (const quizQuestion of source.items) {
    if (seedQuestions.length >= targetTotal) break;
    addQuestion(quizQuestion);
  }
}

if (seedQuestions.length < targetTotal) {
  throw new Error(`Only generated ${seedQuestions.length} non-duplicate questions, below target ${targetTotal}.`);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify({
  versionId: 'content-v1-trial-2026-06',
  generatedAt: new Date().toISOString(),
  minimumTarget: 120,
  questions: seedQuestions
}, null, 2)}\n`, 'utf8');

console.log(`Wrote ${seedQuestions.length} seed questions to ${outputPath}`);
