import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { completeChoiceGame, gotoFreshApp, openGame } from './helpers';

function safeProjectName(name: string) {
  return name.replace(/[^a-z0-9-]/gi, '-');
}

test('keeps welcome and menu framed without overflow', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoFreshApp(page);

  const outputDir = 'test-results/visual';
  await mkdir(outputDir, { recursive: true });
  await page.screenshot({ path: `${outputDir}/welcome-${safeProjectName(testInfo.project.name)}.png`, fullPage: true });

  const welcomeMetrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    canvases: document.querySelectorAll('canvas').length
  }));
  expect(welcomeMetrics.width).toBeLessThanOrEqual(welcomeMetrics.viewport);
  expect(welcomeMetrics.canvases).toBeLessThanOrEqual(2);

  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await expect(page.locator('.home-grid')).toBeVisible();
  await page.screenshot({ path: `${outputDir}/menu-${safeProjectName(testInfo.project.name)}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
});

test('renders earned and unearned stars as distinct non-gray rewards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'local-chromium', 'One deterministic desktop reward screenshot is sufficient.');
  await gotoFreshApp(page);
  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await openGame(page, 'אותיות');
  await completeChoiceGame(page, 'quiz-option', /לשאלה הבאה/, false);
  await expect(page.locator('.stars__active')).toHaveCount(1);
  await expect(page.locator('.stars__empty')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/visual/reward-stars.png', fullPage: true });
});
