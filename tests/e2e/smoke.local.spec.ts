import { expect, test } from '@playwright/test';
import { chooseHomeSettings, completeProfileSetup, installConsoleErrorGuard, openGame, openLobby, selectGameMode } from './helpers';

test.describe('local app smoke', () => {
  test('opens a focused welcome screen and renders all eight games', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await openLobby(page);
    await expect(page.locator('.home-grid .game-card')).toHaveCount(8);
    await expect(page.getByText('גרסה 1.2.0')).toBeVisible();
    await expect(page.getByRole('button', { name: 'אזור הורים' })).toBeVisible();
    assertNoConsoleErrors();
  });

  test('loads decorative videos without exposing playback controls', async ({ page }) => {
    await page.goto('/');
    const welcomeVideo = page.locator('.welcome-motion video');
    await expect(welcomeVideo).toHaveJSProperty('muted', true);
    // Firefox exposes the standard playsinline attribute but not the WebKit
    // `HTMLVideoElement.playsInline` convenience property.
    await expect(welcomeVideo).toHaveAttribute('playsinline', '');
    await expect(welcomeVideo).toHaveJSProperty('controls', false);

    await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
    await completeProfileSetup(page);
    await expect(page.locator('.home-cinematic video')).toHaveCount(1);
  });

  test('persists age, difficulty, and voice locally', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
    await completeProfileSetup(page);
    await chooseHomeSettings(page, 6, 'hard');
    await page.locator('#learner-voice').uncheck({ force: true });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
    const savedLearner = await page.evaluate(() => {
      const snapshot = JSON.parse(window.localStorage.getItem('lomdim-bekef.learning.v4') ?? 'null');
      return snapshot?.profiles.find((profile: { id: string }) => profile.id === snapshot.activeProfileId);
    });
    expect(savedLearner).toMatchObject({ age: 6, manualDifficulty: 'hard' });
    await expect(page.locator('#learner-voice')).not.toBeChecked();
  });

  test('allows profile setup without a nickname or character preference', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
    await expect(page.locator('#learner-name')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'בלי העדפה' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await expect(page.locator('.home-grid')).toBeVisible();
  });

  test('keeps legal links and full local deletion behind the parental gate', async ({ page }) => {
    await openLobby(page);
    await page.getByRole('button', { name: 'אזור הורים' }).click();

    const prompt = await page.locator('label[for="parent-answer"]').textContent();
    const factors = prompt?.match(/(\d+)\s*×\s*(\d+)/);
    expect(factors).not.toBeNull();
    await page.locator('#parent-answer').fill(String(Number(factors![1]) * Number(factors![2])));
    await page.getByRole('button', { name: 'פתיחת אזור הורים' }).click();

    const expectedLegalLinks = [
      '/privacy.html', '/terms.html', '/purchases.html', '/copyright.html', '/licenses.html', '/support.html'
    ];
    for (const href of expectedLegalLinks) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'מחיקת כל הנתונים מהמכשיר' }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'ידע׳לה', level: 1 })).toBeVisible();
    const storage = await page.evaluate(() => ({
      learner: JSON.parse(window.localStorage.getItem('lomdim-bekef.learner.v1') ?? 'null'),
      sessions: window.localStorage.getItem('lomdim-bekef.sessions.v1'),
      recent: window.localStorage.getItem('lomdim-bekef.recent-content.v1'),
      legacyPlayers: window.localStorage.getItem('kids-learning-adventure.players'),
      legacySessions: window.localStorage.getItem('kids-learning-adventure.sessions')
    }));
    expect(storage.learner).toBeNull();
    expect(storage.sessions).toBeNull();
    expect(storage.recent).toBeNull();
    expect(storage.legacyPlayers).toBeNull();
    expect(storage.legacySessions).toBeNull();
  });

  test('loads local JSON without third-party network requests', async ({ page }) => {
    const forbidden: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) forbidden.push(request.url());
    });
    await openLobby(page);
    await openGame(page, 'אותיות');
    await selectGameMode(page, 'quiz');
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
