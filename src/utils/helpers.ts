export function shuffleArray<T>(items: T[]): T[] {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
  }

  return cloned;
}

export function calculateStars(score: number, total: number): number {
  if (total <= 0) return 1;
  const ratio = score / total;
  if (ratio === 1) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function getEncouragementMessage(isCorrect: boolean): string {
  const successMessages = ['כל הכבוד!', 'מצוין!', 'אלוף/ה!', 'מעולה!', 'נהדר!'];
  const retryMessages = ['כמעט!', 'נסו שוב 😊', 'עוד רגע מצליחים!', 'בואו ננסה שוב!'];
  const list = isCorrect ? successMessages : retryMessages;
  return list[Math.floor(Math.random() * list.length)];
}

export function supportsTouch(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
