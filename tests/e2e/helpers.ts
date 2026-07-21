import { expect, Locator, Page } from '@playwright/test';

export type GameTitle = 'אותיות' | 'מספרים' | 'צורות' | 'צבעים' | 'התאמה' | 'זיכרון' | 'רצפים' | 'מיון וסיווג';

const criticalConsolePatterns = [/uncaught/i, /unhandled/i, /typeerror/i, /referenceerror/i];

async function activate(locator: Locator) {
  await locator.evaluate((element: HTMLElement) => element.click());
}

export function installConsoleErrorGuard(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && criticalConsolePatterns.some((pattern) => pattern.test(message.text()))) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return () => expect(errors, `Critical browser errors:\n${errors.join('\n')}`).toEqual([]);
}

export async function gotoFreshApp(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
}

export async function openLobby(page: Page) {
  await gotoFreshApp(page);
  await expect(page.getByRole('heading', { name: 'לומדים בכיף', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await expect(page.locator('.home-grid')).toBeVisible();
  await page.locator('#learner-voice').uncheck();
}

export async function chooseHomeSettings(page: Page, age: number, difficultyValue: 'easy' | 'medium' | 'hard') {
  await page.locator('#learner-age').selectOption(String(age));
  await page.locator('#learner-difficulty').selectOption(difficultyValue);
}

export async function openGame(page: Page, title: GameTitle) {
  const card = page.locator('.game-card').filter({ hasText: title }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'מתחילים' }).click();
  await expect(page.locator('.game-world')).toBeVisible();
}

export async function expectNoUnavailableContent(page: Page) {
  await expect(page.getByText(/אין .* זמינ/)).toHaveCount(0);
  await expect(page.getByText('התוכן לא נטען')).toHaveCount(0);
}

export async function completeChoiceGame(page: Page, optionTestId: string, nextButtonName: RegExp, answerCorrect = true) {
  const answerValue = answerCorrect ? 'true' : 'false';
  for (let index = 0; index < 15; index += 1) {
    const summary = page.locator('.summary-card');
    if (await summary.isVisible().catch(() => false)) return;
    const answerOption = page.locator(`[data-testid="${optionTestId}"][data-correct="${answerValue}"]`).first();
    if (await answerOption.count() === 0) {
      await page.waitForFunction(
        ({ testId, value }) => Boolean(document.querySelector('.summary-card') || document.querySelector(`[data-testid="${testId}"][data-correct="${value}"]`)),
        { testId: optionTestId, value: answerValue }
      );
      if (await summary.isVisible().catch(() => false)) return;
    }
    await expect(answerOption).toBeVisible();
    await activate(answerOption);
    const nextButton = page.getByRole('button', { name: nextButtonName });
    await expect(nextButton).toBeEnabled();
    const statusBefore = await page.locator('.game-world__status small').textContent();
    await activate(nextButton);
    await page.waitForFunction(
      ({ status }) => Boolean(document.querySelector('.summary-card') || document.querySelector('.game-world__status small')?.textContent !== status),
      { status: statusBefore }
    );
  }
  await expect(page.locator('.summary-card')).toBeVisible();
}

export async function completeMatchingGame(page: Page) {
  const leftItems = page.locator('[data-testid="matching-left"]');
  await expect(leftItems.first()).toBeVisible();
  const total = await leftItems.count();
  expect(total).toBeGreaterThan(0);
  for (let index = 0; index < total; index += 1) {
    const left = page.locator('[data-testid="matching-left"]:not(.matching-item--done)').first();
    const pairId = await left.getAttribute('data-pair-id');
    expect(pairId).toBeTruthy();
    await activate(left);
    await activate(page.locator(`[data-testid="matching-right"][data-pair-id="${pairId}"]`));
    await page.waitForFunction(
      ({ id }) => Boolean(document.querySelector('.summary-card') || document.querySelector(`[data-testid="matching-left"][data-pair-id="${id}"]`)?.classList.contains('matching-item--done')),
      { id: pairId }
    );
  }
  await expect(page.locator('.summary-card')).toBeVisible();
}

export async function completeMemoryGame(page: Page) {
  const cards = page.locator('[data-testid="memory-card"]');
  await expect(cards.first()).toBeVisible();
  const pairIds = await cards.evaluateAll((items) => [...new Set(items.map((item) => item.getAttribute('data-pair-id')).filter(Boolean))]);
  expect(pairIds.length).toBeGreaterThan(0);
  for (const pairId of pairIds) {
    const pairCards = page.locator(`[data-testid="memory-card"][data-pair-id="${pairId}"]`);
    await activate(pairCards.nth(0));
    await activate(pairCards.nth(1));
    await page.waitForTimeout(520);
  }
  await expect(page.locator('.summary-card')).toBeVisible();
}
