import { QuizQuestion } from '../../types';

export const colorQuestions: QuizQuestion[] = [
  { id: 'colors-easy-1', category: 'colors', age: [3, 4], difficulty: 'easy', prompt: 'מה הצבע של הבננה?', visual: '🍌', audioText: 'מה הצבע של הבננה?', options: [{ id: 'yellow', label: 'צהוב' }, { id: 'red', label: 'אדום' }, { id: 'blue', label: 'כחול' }], correctOptionId: 'yellow' },
  { id: 'colors-easy-2', category: 'colors', age: [3, 4], difficulty: 'easy', prompt: 'בחרו את הצבע האדום', audioText: 'בחרו את הצבע האדום', options: [{ id: 'red', label: 'אדום', emoji: '🔴' }, { id: 'green', label: 'ירוק', emoji: '🟢' }, { id: 'blue', label: 'כחול', emoji: '🔵' }], correctOptionId: 'red' },
  { id: 'colors-medium-1', category: 'colors', age: [4, 5], difficulty: 'medium', prompt: 'מה הצבע של הים?', visual: '🌊', audioText: 'מה הצבע של הים?', options: [{ id: 'blue', label: 'כחול' }, { id: 'gray', label: 'אפור' }, { id: 'black', label: 'שחור' }], correctOptionId: 'blue' },
  { id: 'colors-medium-2', category: 'colors', age: [4, 5], difficulty: 'medium', prompt: 'מה הצבע של עלה?', visual: '🍃', audioText: 'מה הצבע של עלה?', options: [{ id: 'green', label: 'ירוק' }, { id: 'purple', label: 'סגול' }, { id: 'orange', label: 'כתום' }], correctOptionId: 'green' },
  { id: 'colors-hard-1', category: 'colors', age: [5, 6], difficulty: 'hard', prompt: 'איזה צבע מתקבל כשמערבבים אדום וצהוב?', audioText: 'איזה צבע מתקבל כשמערבבים אדום וצהוב?', options: [{ id: 'orange', label: 'כתום' }, { id: 'green', label: 'ירוק' }, { id: 'brown', label: 'חום' }], correctOptionId: 'orange' },
  { id: 'colors-hard-2', category: 'colors', age: [5, 6], difficulty: 'hard', prompt: 'איזה פרי בדרך כלל ירוק?', audioText: 'איזה פרי בדרך כלל ירוק?', options: [{ id: 'apple', label: 'תפוח ירוק', emoji: '🍏' }, { id: 'strawberry', label: 'תות', emoji: '🍓' }, { id: 'banana', label: 'בננה', emoji: '🍌' }], correctOptionId: 'apple' }
];
