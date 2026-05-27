import { QuizQuestion } from '../../types';
import { colorQuestions } from './colors.questions';
import { letterQuestions } from './letters.questions';
import { numberQuestions } from './numbers.questions';
import { shapeQuestions } from './shapes.questions';

export const allQuizQuestions: QuizQuestion[] = [
  ...letterQuestions,
  ...numberQuestions,
  ...shapeQuestions,
  ...colorQuestions
];

export { colorQuestions, letterQuestions, numberQuestions, shapeQuestions };
