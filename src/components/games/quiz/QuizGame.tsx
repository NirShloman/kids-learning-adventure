import type { QuizQuestion } from '../../../types';
import { DetectiveGame, DetectiveGameProps } from '../detective/DetectiveGame';
interface Props extends Omit<DetectiveGameProps, 'age' | 'difficulty'> { title: string; questions: QuizQuestion[] }
export function QuizGame({title: _title, questions, ...props}: Props) {
  return <DetectiveGame {...props} age={questions[0].ages[0]} difficulty={questions[0].difficulty} initialItems={questions} />;
}
