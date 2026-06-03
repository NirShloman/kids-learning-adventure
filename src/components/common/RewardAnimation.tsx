type RewardEvent = 'success' | 'confetti' | 'stars';

interface RewardAnimationProps {
  event: RewardEvent;
  isActive?: boolean;
}

export function RewardAnimation({ event, isActive = true }: RewardAnimationProps) {
  if (!isActive) return null;

  return (
    <div className={`reward-animation reward-animation--${event}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
    </div>
  );
}
