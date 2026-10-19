import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openLobby } from './helpers';
import { solveDetectiveStep } from './detective-helpers';

test('home action resumes the active child’s adaptive round', async ({ page }) => {
  await openLobby(page);
  await expect(page.getByRole('heading', { name: 'היי נועה, כיף שחזרת!' })).toBeVisible();
  await page.getByRole('button', { name: 'יוצאים להרפתקה', exact: true }).click();
  await expect(page.getByTestId('adaptive-session')).toBeVisible();
  await solveDetectiveStep(page);
  const saved = await page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);
    return snapshot.dataByProfile[snapshot.activeProfileId].detectives.rounds.mixed;
  });
  await page.getByRole('button', { name: 'חזרה לתפריט', exact: true }).click();
  await page.getByRole('button', { name: 'ממשיכים לגלות', exact: true }).click();
  await expect(page.getByTestId('adaptive-session')).toBeVisible();
  const resumed = await page.evaluate(() => {
    const snapshot = JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);
    return snapshot.dataByProfile[snapshot.activeProfileId].detectives.rounds.mixed;
  });
  expect(resumed.id).toBe(saved.id);
  expect(resumed.index).toBe(saved.index);
});

test('home stays usable across phone, landscape and tablet sizes', async ({ page }, testInfo) => {
  await openLobby(page);
  for (const [width, height] of [[320,568], [393,851], [844,390], [1024,768], [1280,800]]) {
    await page.setViewportSize({ width, height });
    if (height <= 450 && width > height) {
      await page.getByRole('button', { name: '🌱 המסלול שלי' }).click();
      await expect(page.getByRole('button', { name: 'מתחילים תרגול מותאם', exact: true })).toBeVisible();
      await page.getByRole('button', { name: '🎲 משחקים' }).click();
    } else {
      await expect(page.getByRole('button', { name: 'יוצאים להרפתקה', exact: true })).toBeVisible();
    }
    await expect(page.locator('.home-grid .game-card')).toHaveCount(width >= 900 && height >= 650 ? 8 : 4);
    const geometry = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.home-grid .game-card')].map(card => card.getBoundingClientRect());
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        cards: cards.map(card => ({ width: card.width, height: card.height })) };
    });
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
    expect(geometry.cards.every(card => card.width >= 56 && card.height >= 56)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}x${height}.png`), fullPage: true });
    await page.getByRole('button', { name: '⚙️ צלילים' }).click();
    await expect(page.locator('#learner-voice')).not.toBeChecked();
    await page.getByRole('button', { name: '🎲 משחקים' }).click();
  }
});

test('home supports keyboard navigation, reduced motion and enlarged text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openLobby(page);
  const accessibility = await new AxeBuilder({ page }).include('.app-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.setViewportSize({ width: 393, height: 851 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.getByRole('button', { name: '⚙️ צלילים' }).click();
  const voice = page.locator('#learner-voice');
  await voice.focus();
  await page.keyboard.press('Space');
  await expect(voice).toBeChecked();
  await page.getByRole('button', { name: '🎲 משחקים' }).click();
  await expect(page.getByRole('button', { name: 'יוצאים להרפתקה', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
