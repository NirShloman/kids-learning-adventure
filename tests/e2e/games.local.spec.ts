import { test } from '@playwright/test';
import {
  completeChoiceGame,
  completeMatchingGame,
  completeMemoryGame,
  expectNoUnavailableContent,
  installConsoleErrorGuard,
  openGame,
  openLobby
} from './helpers';

const quizGames = ['אותיות', 'מספרים', 'צורות', 'צבעים'] as const;

for (const title of quizGames) {
  test(`completes quiz game: ${title}`, async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await openLobby(page);
    await openGame(page, title);
    await expectNoUnavailableContent(page);
    await completeChoiceGame(page, 'quiz-option', /לשאלה הבאה/);
    assertNoConsoleErrors();
  });
}

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
  await completeMemoryGame(page);
  assertNoConsoleErrors();
});
