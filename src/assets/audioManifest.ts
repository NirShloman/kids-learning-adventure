export const musicTracks = {
  mainTheme: 'music/game-of-discoveries',
  mainThemeShort: 'music/letters-garden',
  home: 'music/garden-gate',
  modeSelection: 'music/garden-gate',
  letters: 'music/garden-gate',
  numbers: 'music/sunlight-on-the-bookshelf',
  shapes: 'music/polygons-at-play',
  colors: 'music/painted-garden-gate',
  matching: 'music/garden-gate',
  memory: 'music/sunlight-on-the-bookshelf',
  patterns: 'music/polygons-at-play',
  sorting: 'music/painted-garden-gate',
  summary: 'music/garden-gate'
} as const;

export type MusicTrack = keyof typeof musicTracks;
export type MusicTrackKind = 'song' | 'instrumental';
export type MusicUsage = 'intro' | 'background';

export interface MusicTrackDefinition {
  source: (typeof musicTracks)[MusicTrack];
  kind: MusicTrackKind;
  loop: boolean;
  allowedUsage: readonly MusicUsage[];
}

/**
 * Songs with lyrics are deliberately limited to the welcome sequence. Every
 * track selected by a playable world is instrumental, so narration and game
 * feedback remain easy to hear.
 */
export const musicTrackDefinitions: Record<MusicTrack, MusicTrackDefinition> = {
  mainTheme: { source: musicTracks.mainTheme, kind: 'song', loop: false, allowedUsage: ['intro'] },
  mainThemeShort: { source: musicTracks.mainThemeShort, kind: 'song', loop: false, allowedUsage: ['intro'] },
  home: { source: musicTracks.home, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  modeSelection: { source: musicTracks.modeSelection, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  letters: { source: musicTracks.letters, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  numbers: { source: musicTracks.numbers, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  shapes: { source: musicTracks.shapes, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  colors: { source: musicTracks.colors, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  matching: { source: musicTracks.matching, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  memory: { source: musicTracks.memory, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  patterns: { source: musicTracks.patterns, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  sorting: { source: musicTracks.sorting, kind: 'instrumental', loop: true, allowedUsage: ['background'] },
  summary: { source: musicTracks.summary, kind: 'instrumental', loop: true, allowedUsage: ['background'] }
};

/**
 * The supplied package contains music only. These names preserve the game
 * event contract while effects use the small in-browser fallback palette.
 */
export const sfxTracks = {
  select: 'select',
  flip: 'flip',
  pickup: 'pickup',
  drop: 'drop',
  match: 'match',
  correct: 'correct',
  retry: 'retry',
  levelStart: 'level-start',
  levelComplete: 'level-complete',
  starReward: 'star-reward',
  badgeReward: 'badge-reward',
  confetti: 'confetti',
  bonus: 'bonus',
  locked: 'locked',
  unlock: 'unlock',
  countTick: 'count-tick',
  objectNear: 'object-near',
  wrongTarget: 'wrong-target',
  characterStep1: 'character-step-01',
  characterStep2: 'character-step-02',
  characterJump: 'character-jump',
  characterLand: 'character-land',
  itemCollected: 'item-collected',
  gamePause: 'game-pause',
  gameResume: 'game-resume'
} as const;

export const recordedVoiceTracks = {
  wellDone: 'well-done',
  great: 'great',
  excellent: 'excellent',
  success: 'success',
  matchFound: 'match-found',
  pairFound: 'pair-found',
  tryAgain: 'try-again',
  almost: 'almost',
  chooseAnswer: 'choose-answer',
  areYouReady: 'are-you-ready',
  levelComplete: 'level-complete',
  unlockedGame: 'unlocked-game',
  collectedStar: 'collected-star',
  goHome: 'go-home',
  letsStart: 'lets-start'
} as const;

export type SfxCue = keyof typeof sfxTracks;
export type RecordedVoiceCue = keyof typeof recordedVoiceTracks;

export function audioSource(relativeBase: string): string {
  return `/assets/audio/${relativeBase}.mp3`;
}
