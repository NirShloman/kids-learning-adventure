// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DetectiveSession } from '../../src/components/games/detective/DetectiveSession';
import { newRound } from '../../src/components/games/detective/detectiveEngine';
import { createProfile, getDetectiveProgress } from '../../src/services/learningStoreService';
import type { GameId } from '../../src/types';
import type { DetectiveItem } from '../../src/types/detective.types';

vi.mock('../../src/services/narrationService', () => ({
  playNarrationText: vi.fn(), stopNarrationPlayback: vi.fn(), preloadNarrationTexts: vi.fn(),
}));
vi.mock('../../src/services/audioService', () => ({ playSfx: vi.fn() }));

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const choices = ['letters', 'numbers', 'shapes', 'colors', 'patterns', 'sorting'] as const;
function mount(gameId: GameId, mixed = false, restoredWrong = false) {
  const profile = createProfile({ age: 4, narrationEnabled: false });
  // Reused answer IDs and identical prompts must still start a fresh question.
  const items = [0, 1].map((index) => ({
    id: `${gameId}-selection-${index}`, ages: [4], difficulty: 'medium',
    prompt: 'מה מתאים?', correctOptionId: 'a',
    options: [{ id: 'a', label: 'נכון' }, { id: 'b', label: 'אחר' }, { id: 'c', label: 'עוד' }],
    leftVisual: { kind: 'text', label: `זוג ${index}`, value: `${index}` },
    rightVisual: { kind: 'text', label: `זוג ${index}`, value: `${index}` },
  })) as DetectiveItem[];
  const pairMode = gameId === 'matching' || gameId === 'memory';
  const round = newRound(pairMode ? [{ gameId, ids: items.map(i => i.id) }]
    : items.map(i => ({ gameId, ids: [i.id] })), 'test', 4, 'medium');
  if (restoredWrong) round.wrongOptions[items[0].id] = ['b'];
  act(() => root.render(<DetectiveSession profile={profile} scope={mixed ? 'mixed' : gameId}
    items={items} initialRound={round} voiceEnabled={false} onBack={vi.fn()} onFinish={vi.fn()} />));
  return { profile, items };
}
const buttons = () => [...host.querySelectorAll<HTMLButtonElement>('.detective-answer')];
const marked = () => host.querySelectorAll('.option-card--correct, .option-card--wrong');
const settle = () => act(() => vi.advanceTimersByTime(1500));

it.each(choices)('%s clears each attempt and replaces answer controls on advance', (gameId) => {
  const { profile, items } = mount(gameId);
  const old = buttons();
  act(() => old[1].click());
  expect(old[1].classList.contains('option-card--wrong')).toBe(true);
  expect(old.every(button => button.disabled)).toBe(true);
  settle();
  expect(marked()).toHaveLength(0);
  expect(old.every(button => !button.disabled)).toBe(true);
  act(() => old[2].click());
  expect(marked()).toHaveLength(1);
  settle();
  act(() => { old[0].focus(); old[0].click(); old[0].click(); });
  expect(old[0].classList.contains('option-card--correct')).toBe(true);
  expect(marked()).toHaveLength(1);
  settle();
  expect(marked()).toHaveLength(0);
  expect(old[0].isConnected).toBe(false);
  expect(buttons().every(button => !button.disabled)).toBe(true);
  expect(document.activeElement).toBe(host.querySelector('.detective-card h2'));
  const saved = getDetectiveProgress(profile.id).rounds[gameId]!;
  expect(saved.index).toBe(1);
  expect(saved.attempts[items[0].id]).toBe(3);
  expect(saved.wrongOptions[items[0].id]).toEqual(['b', 'c']);
});

it('keeps restored mistake history without showing a stale selection', () => {
  mount('letters', false, true);
  expect(marked()).toHaveLength(0);
});

it('also clears answers in adaptive practice', () => {
  mount('patterns', true);
  act(() => buttons()[0].click());
  settle();
  expect(marked()).toHaveLength(0);
  expect(host.querySelector('.detective-chip')?.textContent).toContain('2/2');
});

it.each(['matching', 'memory'] as const)('%s resets unmatched and matched pair selections after feedback', (gameId) => {
  mount(gameId);
  const cards = [...host.querySelectorAll<HTMLButtonElement>('.detective-pair-card')];
  const first = cards[0];
  const other = cards.find(c => c.dataset.pairId !== first.dataset.pairId && c.dataset.testid === first.dataset.testid)!;
  const opposite = gameId === 'matching'
    ? cards.find(c => c.dataset.pairId === other.dataset.pairId && c.dataset.testid !== first.dataset.testid)!
    : other;
  act(() => first.click());
  act(() => opposite.click());
  expect(host.querySelectorAll('[aria-pressed="true"]')).toHaveLength(2);
  settle();
  expect(host.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  const partner = cards.find(c => c !== first && c.dataset.pairId === first.dataset.pairId)!;
  act(() => first.click());
  act(() => partner.click());
  settle();
  expect(host.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  expect(host.querySelectorAll('.is-matched')).toHaveLength(2);
});
