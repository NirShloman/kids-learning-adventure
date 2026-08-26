export type NarrationPriority = 'required' | 'recommended' | 'optional';
export interface NarrationEntry {
  id: string;
  text: string;
  category: 'instruction' | 'feedback' | 'content' | 'letter' | 'word' | 'sound';
  priority: NarrationPriority;
  recordedPath?: string;
  checksum?: string;
  durationMs?: number;
}

export const fixedNarrationEntries: readonly NarrationEntry[] = [
  { id: 'ui.welcome.start', text: 'מתחילים לשחק וללמוד בכיף.', category: 'instruction', priority: 'required' },
  { id: 'feedback.correct.01', text: 'כל הכבוד!', category: 'feedback', priority: 'required' },
  { id: 'feedback.correct.02', text: 'מצוין!', category: 'feedback', priority: 'required' },
  { id: 'feedback.retry.01', text: 'כמעט. ננסה שוב.', category: 'feedback', priority: 'required' },
  { id: 'instruction.repeat', text: 'נשמע שוב, לאט ובנחת.', category: 'instruction', priority: 'recommended' }
] as const;

const fixedById = new Map(fixedNarrationEntries.map((entry) => [entry.id, entry]));

export function contentNarrationEntry(contentId: string, text: string): NarrationEntry {
  return { id: `content.${contentId}`, text, category: 'content', priority: 'required' };
}

export function getNarrationEntry(id: string): NarrationEntry | undefined {
  return fixedById.get(id);
}
