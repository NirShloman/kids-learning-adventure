import { colorQuestions, letterQuestions, numberQuestions, shapeQuestions } from '../src/data/questions';
import { matchingPairs, memoryCards, patternPuzzles, sortingChallenges } from '../src/data/activityData';
import { reviewQuestionBankContent } from '../src/services/speechTherapistAgent';

const questionBank = {
  letters: letterQuestions,
  numbers: numberQuestions,
  shapes: shapeQuestions,
  colors: colorQuestions,
  matchingPairs,
  memoryCards,
  patternPuzzles,
  sortingChallenges
};

const report = reviewQuestionBankContent(questionBank);

const counts = {
  letters: letterQuestions.length,
  numbers: numberQuestions.length,
  shapes: shapeQuestions.length,
  colors: colorQuestions.length,
  matchingPairs: matchingPairs.length,
  memoryPairs: new Set(memoryCards.map((card) => card.pairId)).size,
  memoryCards: memoryCards.length,
  patternPuzzles: patternPuzzles.length,
  sortingChallenges: sortingChallenges.length
};

console.log('Question bank counts:', counts);

if (!report.approved) {
  console.error(`Quality review failed with ${report.summary.rejectedItems} issue(s).`);
  report.reviews
    .filter((review) => !review.approved)
    .slice(0, 50)
    .forEach((review) => {
      console.error(`${review.questionId}: ${review.notes.join(' ')}`);
    });
  process.exitCode = 1;
} else {
  console.log(`Quality review passed for ${report.summary.totalItems} items.`);
}
