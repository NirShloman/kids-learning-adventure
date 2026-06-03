import { expect, test } from '@playwright/test';
import { chooseHomeSettings, chooseLandingSettings, expectNoUnavailableContent, installConsoleErrorGuard, openGame, openLobby } from './helpers';

test.describe('local app smoke', () => {
  test('opens, enters lobby, and renders all game cards without Firebase', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);

    await openLobby(page);

    await expect(page.locator('.home-grid .game-card')).toHaveCount(8);
    await expect(page.getByText('לפני שמתחילים')).toBeVisible();
    await expectNoUnavailableContent(page);
    assertNoConsoleErrors();
  });

  test('supports age and difficulty choices from landing and lobby', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);

    await page.goto('/');
    await chooseLandingSettings(page, 6, /מתקדם/);
    await page.getByRole('button', { name: /כניסה לתפריט המשחקים/ }).click();
    await chooseHomeSettings(page, 3, 'easy');
    await chooseHomeSettings(page, 4, 'medium');
    await chooseHomeSettings(page, 6, 'hard');

    await expect(page.locator('.home-grid')).toBeVisible();
    assertNoConsoleErrors();
  });

  test('loads a quiz game from the bundled fallback bank', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);

    await openLobby(page);
    await openGame(page, 'אותיות');
    await expect(page.locator('[data-testid="quiz-option"]')).toHaveCount(3);
    await expectNoUnavailableContent(page);
    assertNoConsoleErrors();
  });

  test('renders number questions without generic English hints or missing-image fallbacks', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);

    await openLobby(page);
    await chooseHomeSettings(page, 3, 'easy');
    await openGame(page, 'מספרים');

    await expect(page.getByText('Look carefully at the choices and pick the one that matches.')).toHaveCount(0);
    await expect(page.getByText('בחרו את התשובה המתאימה.')).toHaveCount(0);
    await expect(page.locator('.game-image-fallback')).toHaveCount(0);
    await expect(page.locator('.question-card__visual')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-option"]')).toHaveCount(3);
    assertNoConsoleErrors();
  });
});
