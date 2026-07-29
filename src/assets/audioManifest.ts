export const musicTracks = {
  mainTheme: 'music/game-of-discoveries',
  mainThemeShort: 'music/garden-gate',
  home: 'music/game-of-discoveries',
  modeSelection: 'music/garden-gate',
  letters: 'music/letters-garden',
  numbers: 'music/sunlight-on-the-bookshelf',
  shapes: 'music/polygons-at-play',
  colors: 'music/painted-garden-gate',
  matching: 'music/garden-gate',
  memory: 'music/sunlight-on-the-bookshelf',
  patterns: 'music/polygons-at-play',
  sorting: 'music/game-of-discoveries',
  summary: 'music/game-of-discoveries'
} as const;

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

export type MusicTrack = keyof typeof musicTracks;
export type SfxCue = keyof typeof sfxTracks;
export type RecordedVoiceCue = keyof typeof recordedVoiceTracks;

export function audioSource(relativeBase: string): string {
  return `/assets/audio/${relativeBase}.mp3`;
}
