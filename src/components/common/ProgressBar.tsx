interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total <= 0 ? 0 : Math.min((current / total) * 100, 100);
  return (
    <div className="progress" aria-label={`שאלה ${Math.min(current, total)} מתוך ${total}`}>
      <div className="progress__track"><div className="progress__fill" style={{ width: `${percentage}%` }} /></div>
      <span className="progress__label">שאלה {Math.min(current, total)} מתוך {total}</span>
    </div>
  );
}
