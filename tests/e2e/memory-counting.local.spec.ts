import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { bootDetective, enterDetective } from './detective-helpers';
import { newRound } from '../../src/components/games/detective/detectiveEngine';
import type { DetectiveItem } from '../../src/types/detective.types';

const bank = JSON.parse(readFileSync('src/content/memory.json', 'utf8')) as { contentVersion: string; items: DetectiveItem[] };
const items = bank.items.filter(item => item.ages.includes(6) && item.difficulty === 'hard' && item.rightVisual?.kind === 'quantity')
  .sort((a, b) => (b.rightVisual?.count ?? 0) - (a.rightVisual?.count ?? 0)).slice(0, 7);

for (const [width, height] of [[320,568], [568,320], [393,851], [768,1024], [1024,768]]) {
  test(`large memory quantities stay countable and match after scrolling at ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await bootDetective(page, 6, 'hard');
    const round = newRound([{ gameId: 'memory', ids: items.map(item => item.id) }], bank.contentVersion, 6, 'hard');
    await page.evaluate(round => {
      const snapshot = JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);
      snapshot.dataByProfile[snapshot.activeProfileId].detectives = { rounds: { memory: round }, discoveries: [] };
      localStorage.setItem('lomdim-bekef.learning.v4', JSON.stringify(snapshot));
    }, round);
    await enterDetective(page, 'memory');
    const pair = page.locator(`[data-testid="memory-card"][data-pair-id="${items[0].id}"]`);
    const quantity = pair.filter({ has: page.locator('.detective-quantity') });
    await page.locator(`[data-pair-id="${items[0].id}"][data-token-kind="quantity"]`).click();
    await expect(quantity.locator('.detective-quantity > span')).toHaveCount(items[0].rightVisual!.count!);
    await quantity.scrollIntoViewIfNeeded();
    const layout = await quantity.evaluate(card => {
      const token = card.querySelector('.detective-quantity')!;
      const face = card.getBoundingClientRect();
      const objects = [...token.children].map(object => object.getBoundingClientRect());
      const board = card.closest('.detective-pair-grid')!.getBoundingClientRect();
      return { fontSize: parseFloat(getComputedStyle(token).fontSize),
        fits: objects.every(object => object.left >= face.left && object.right <= face.right && object.top >= face.top && object.bottom <= face.bottom && object.top >= board.top && object.bottom <= board.bottom),
        boardFits: board.top >= 0 && board.bottom <= innerHeight + 1,
        pageFits: document.documentElement.scrollWidth <= innerWidth + 1 && document.documentElement.scrollHeight <= innerHeight + 1 };
    });
    expect(layout.fontSize).toBeGreaterThanOrEqual(22);
    expect(layout.fits).toBe(true);
    expect(layout.boardFits).toBe(true);
    expect(layout.pageFits).toBe(true);
    await page.screenshot({ path: info.outputPath('counting-card.png') });
    const numeral = pair.filter({ hasNot: page.locator('.detective-quantity') });
    await numeral.click();
    await expect(pair.first()).toHaveClass(/is-matched/);
    await expect(pair.last()).toHaveClass(/is-matched/);
  });
}
