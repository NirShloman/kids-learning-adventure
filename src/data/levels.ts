import { Age, Difficulty } from '../types';

export const ageOptions: Age[] = [3, 4, 5, 6];

export const difficultyOptions: Array<{ id: Difficulty; label: string; description: string }> = [
  { id: 'easy', label: 'קל', description: 'שאלות קצרות וברורות' },
  { id: 'medium', label: 'בינוני', description: 'יותר אפשרויות וחשיבה' },
  { id: 'hard', label: 'מתקדם', description: 'אתגר לילדים גדולים יותר' }
];

export function getDefaultDifficultyByAge(age: Age): Difficulty {
  if (age <= 3) return 'easy';
  if (age <= 5) return 'medium';
  return 'hard';
}
