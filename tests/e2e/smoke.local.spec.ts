import { expect, test } from '@playwright/test';
import { chooseHomeSettings, installConsoleErrorGuard, openGame, openLobby } from './helpers';

test.describe('local app smoke', () => {
  test('opens a focused welcome screen and renders all eight games', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await openLobby(page);
    await expect(page.locator('.home-grid .game-card')).toHaveCount(8);
    await expect(page.getByText('גרסה 1.2.0')).toBeVisible();
    await expect(page.getByText(/אזור הורים|ניהול תוכן|שחקן חדש/)).toHaveCount(0);
    assertNoConsoleErrors();
  });

  test('persists age, difficulty, and voice locally', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
    await chooseHomeSettings(page, 6, 'hard');
    await page.locator('#learner-voice').uncheck();
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
    await expect(page.locator('#learner-age')).toHaveValue('6');
    await expect(page.locator('#learner-difficulty')).toHaveValue('hard');
    await expect(page.locator('#learner-voice')).not.toBeChecked();
  });

  test('loads local JSON without cloud or font CDN requests', async ({ page }) => {
    const forbidden: string[] = [];
    page.on('request', (request) => {
      if (/firebase|firestore|googleapis\.com\/css|fonts\.gstatic|rive\.app\/.*\.riv/i.test(request.url())) forbidden.push(request.url());
    });
    await openLobby(page);
    await openGame(page, 'אותיות');
    await expect(page.locator('[data-testid="quiz-option"]')).toHaveCount(3);
    expect(forbidden).toEqual([]);
  });

  test('keeps the primary action visible at 320 by 568', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    const button = page.getByRole('button', { name: /מתחילים לשחק/ });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(568);
    expect(box!.height).toBeGreaterThanOrEqual(56);
  });
});
