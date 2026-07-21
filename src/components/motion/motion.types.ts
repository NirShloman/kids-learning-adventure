export type MotionEvent =
  | 'idle'
  | 'listen'
  | 'success'
  | 'retry'
  | 'wave'
  | 'celebrate'
  | 'intro'
  | 'correct'
  | 'reveal';

export type RiveSceneName = 'mascot-guide' | 'brand-intro' | 'answer-feedback' | 'reward-stars';

export interface MotionPayload {
  event: MotionEvent;
  stars?: number;
}

export function getMotionInputName(event: MotionEvent): string {
  return event === 'intro' ? 'wave' : event;
}
