import { expect, test } from '@playwright/test';
import {
  completeChoiceGame,
  completeMatchingGame,
  completeMemoryGame,
  expectNoUnavailableContent,
  installConsoleErrorGuard,
  openGame,
  openLobby,
  selectGameMode
} from './helpers';

const quizGames = ['אותיות', 'מספרים', 'צורות', 'צבעים'] as const;

for (const title of quizGames) {
  test(`completes quiz game: ${title}`, async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await openLobby(page);
    await openGame(page, title);
    await selectGameMode(page, 'quiz');
    await expectNoUnavailableContent(page);
    await completeChoiceGame(page, 'quiz-option', /לשאלה הבאה/);
    assertNoConsoleErrors();
  });
}

test('offers a retry after an error and advances after success feedback', async ({ page }) => {
  await openLobby(page); await openGame(page, 'אותיות'); await selectGameMode(page, 'quiz');
  const status = page.locator('.detective-chip'); const initial = await status.textContent();
  await page.locator('[data-testid="quiz-option"][data-correct="true"]').click();
  await expect(page.locator('.option-card--correct')).toBeVisible();
  await page.waitForTimeout(1100); await expect(status).toHaveText(initial!);
  await expect(status).not.toHaveText(initial!);
  await page.locator('[data-testid="quiz-option"][data-correct="false"]').first().click();
  await expect(page.locator('.detective-feedback--hint')).toBeVisible();
  await expect(page.locator('[data-testid="quiz-option"][data-correct="true"]')).toBeEnabled();
  await expect(page.locator('.option-card--correct')).toHaveCount(0);
});

test('completes patterns game', async ({ page }) => {
  const assertNoConsoleErrors = installConsoleErrorGuard(page);
  await openLobby(page);
  await openGame(page, 'רצפים');
  await expectNoUnavailableContent(page);
  await completeChoiceGame(page, 'pattern-option', /לרצף הבא/);
  assertNoConsoleErrors();
});

test('completes sorting game', async ({ page }) => {
  const assertNoConsoleErrors = installConsoleErrorGuard(page);
  await openLobby(page);
  await openGame(page, 'מיון וסיווג');
  await expectNoUnavailableContent(page);
  await completeChoiceGame(page, 'sorting-option', /לפריט הבא/);
  assertNoConsoleErrors();
});

test('completes matching game', async ({ page }) => {
  const assertNoConsoleErrors = installConsoleErrorGuard(page);
  await openLobby(page);
  await openGame(page, 'התאמה');
  await expectNoUnavailableContent(page);
  await completeMatchingGame(page);
  assertNoConsoleErrors();
});

test('completes memory game', async ({ page }) => {
  const assertNoConsoleErrors = installConsoleErrorGuard(page);
  await openLobby(page);
  await openGame(page, 'זיכרון');
  await expectNoUnavailableContent(page);
  const firstCard = page.locator('[data-testid="memory-card"]').first();
  await firstCard.click();
  await expect(firstCard).toHaveAttribute('aria-pressed', 'true');
  await expect(firstCard).not.toHaveClass(/detective-pair-card--hidden/);
  await completeMemoryGame(page);
  assertNoConsoleErrors();
});
