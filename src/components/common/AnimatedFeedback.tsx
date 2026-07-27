import { useEffect } from 'react';
import { RiveScene } from '../motion/RiveScene';
import { playAudioCue } from '../../services/audioService';

interface AnimatedFeedbackProps {
  message: string;
  tone: 'correct' | 'wrong' | 'neutral';
}

export function AnimatedFeedback({ message, tone }: AnimatedFeedbackProps) {
  useEffect(() => {
    if (!message || tone === 'neutral') return;
    playAudioCue(tone === 'correct' ? 'correct' : 'retry');
  }, [message, tone]);

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
