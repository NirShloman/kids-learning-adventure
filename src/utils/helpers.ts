export function shuffleArray<T>(items: T[]): T[] {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
  }

  return cloned;
}

interface StarOptions {
  attempts?: number;
  idealAttempts?: number;
  forgivingExtraAttempts?: number;
}

export function calculateStars(score: number, total: number, options: StarOptions = {}): number {
  if (total <= 0) return 0;
  const ratio = score / total;

  if (ratio === 1 && options.attempts && options.idealAttempts) {
    const forgivingExtraAttempts = options.forgivingExtraAttempts ?? Math.ceil(total * 0.5);
    if (options.attempts <= options.idealAttempts + 1) return 3;
    if (options.attempts <= options.idealAttempts + forgivingExtraAttempts) return 2;
    return 1;
  }

  if (ratio === 1) return 3;
  if (ratio >= 0.75) return 2;
  return 1;
}

export function getStarMessage(stars: number): string {
  if (stars >= 3) return 'ביצוע מצוין! שמרתם על דיוק נהדר.';
  if (stars === 2) return 'עבודה יפה מאוד. עוד קצת תרגול ותקבלו שלושה כוכבים.';
  if (stars === 1) return 'כל הכבוד שסיימתם. ממשיכים להתאמן בקצב רגוע.';
  return 'סיימתם את הפעילות. ננסה שוב ונצבור ביטחון.';
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
