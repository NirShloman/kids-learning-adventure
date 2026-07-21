import { RiveScene } from '../motion/RiveScene';

interface AnimatedFeedbackProps {
  message: string;
  tone: 'correct' | 'wrong' | 'neutral';
}

export function AnimatedFeedback({ message, tone }: AnimatedFeedbackProps) {
  if (!message) return null;
  const icon = tone === 'correct' ? '✓' : tone === 'wrong' ? '↻' : '•';
  const fallback = <span className="animated-feedback__icon" aria-hidden="true">{icon}</span>;

  return (
    <div className={`animated-feedback animated-feedback--${tone}`} role="status">
      <RiveScene
        scene="answer-feedback"
        event={tone === 'correct' ? 'correct' : 'retry'}
        className="animated-feedback__motion"
        fallback={fallback}
      />
      <span>{message}</span>
    </div>
  );
}
