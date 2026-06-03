interface AnimatedFeedbackProps {
  message: string;
  tone: 'correct' | 'wrong' | 'neutral';
}

export function AnimatedFeedback({ message, tone }: AnimatedFeedbackProps) {
  if (!message) return null;
  return <div className={`animated-feedback animated-feedback--${tone}`} role="status">{message}</div>;
}
