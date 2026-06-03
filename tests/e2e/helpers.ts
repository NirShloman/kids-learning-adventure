import { expect, Page, test } from '@playwright/test';

export type GameTitle = 'אותיות' | 'מספרים' | 'צורות' | 'צבעים' | 'התאמה' | 'זיכרון' | 'רצפים' | 'מיון וסיווג';

const criticalConsolePatterns = [
  /uncaught/i,
  /unhandled/i,
  /typeerror/i,
  /referenceerror/i,
  /firebase.*permission/i
];

export function installConsoleErrorGuard(page: Page) {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (criticalConsolePatterns.some((pattern) => pattern.test(text))) errors.push(text);
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return () => {
    expect(errors, `Critical browser errors:\n${errors.join('\n')}`).toEqual([]);
  };
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
  await expect(page.getByRole('heading', { name: 'נכנסים לעולם למידה צבעוני' })).toBeVisible();
  await page.getByRole('button', { name: /כניסה לתפריט המשחקים/ }).click();
  await expect(page.locator('.home-grid')).toBeVisible();
}

export async function chooseLandingSettings(page: Page, age: number, difficultyLabel: RegExp) {
  await page.locator('#landing-age-select').selectOption(String(age));
  await page.getByLabel(difficultyLabel).check();
}

export async function chooseHomeSettings(page: Page, age: number, difficultyValue: 'easy' | 'medium' | 'hard') {
  await page.locator('.settings-grid select').first().selectOption(String(age));
  await page.locator('.settings-grid select').nth(1).selectOption(difficultyValue);
}

export async function openGame(page: Page, title: GameTitle) {
  const card = page.locator('.game-card').filter({ hasText: title }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'מתחילים' }).click();
  await expect(page.locator('.game-world')).toBeVisible();
}

export async function expectNoUnavailableContent(page: Page) {
  await expect(page.getByText(/אין .* זמינ/)).toHaveCount(0);
}

export async function completeChoiceGame(page: Page, optionTestId: string, nextButtonName: RegExp) {
  for (let index = 0; index < 15; index += 1) {
    const summary = page.getByText('סיכום משחק');
    if (await summary.isVisible().catch(() => false)) return;

    const correctOption = page.locator(`[data-testid="${optionTestId}"][data-correct="true"]`).first();
    if (await correctOption.count() === 0) {
      await summary.waitFor({ state: 'visible', timeout: 1_500 }).catch(() => undefined);
      if (await summary.isVisible().catch(() => false)) return;
    }
    await expect(correctOption).toBeVisible();
    await correctOption.click();

    const nextButton = page.getByRole('button', { name: nextButtonName });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await page.waitForTimeout(100);
  }

  await expect(page.getByText('סיכום משחק')).toBeVisible();
}

export async function completeMatchingGame(page: Page) {
  const pairIds = await page.locator('[data-testid="matching-left"]').evaluateAll((items) =>
    items.map((item) => item.getAttribute('data-pair-id')).filter(Boolean)
  );

  expect(pairIds.length).toBeGreaterThan(0);

  for (const pairId of pairIds) {
    await page.locator(`[data-testid="matching-left"][data-pair-id="${pairId}"]`).click();
    await page.locator(`[data-testid="matching-right"][data-pair-id="${pairId}"]`).click();
  }

  await expect(page.getByText('סיכום משחק')).toBeVisible();
}

export async function completeMemoryGame(page: Page) {
  await expect(page.locator('[data-testid="memory-card"]').first()).toBeVisible();
  const pairIds = await page.locator('[data-testid="memory-card"]').evaluateAll((items) =>
    [...new Set(items.map((item) => item.getAttribute('data-pair-id')).filter(Boolean))]
  );

  expect(pairIds.length).toBeGreaterThan(0);

  for (const pairId of pairIds) {
    const cards = page.locator(`[data-testid="memory-card"][data-pair-id="${pairId}"]`);
    await cards.nth(0).click();
    await cards.nth(1).click();
    await page.waitForTimeout(520);
  }

  await expect(page.getByText('סיכום משחק')).toBeVisible();
}

export async function unlockParentArea(page: Page) {
  await openLobby(page);
  await page.getByRole('button', { name: 'אזור הורים' }).click();
  await expect(page.getByRole('heading', { name: /הגדרת קוד הורה|כניסה לאזור ההורים/ })).toBeVisible();
  await page.locator('.parent-gate input').first().fill('1234');
  const confirmInput = page.locator('.parent-gate input').nth(1);
  if (await confirmInput.isVisible().catch(() => false)) await confirmInput.fill('1234');
  await page.getByRole('button', { name: /שמירת קוד וכניסה|כניסה/ }).click();
  await expect(page.getByText('מעקב התקדמות לפי שחקנים')).toBeVisible();
}

export async function openAdmin(page: Page) {
  await unlockParentArea(page);
  await page.getByRole('button', { name: 'ניהול תוכן' }).click();
  await expect(page.getByRole('heading', { name: 'ניהול מאגר שאלות' })).toBeVisible();
}

export function withCleanPage(testInfoTitle: string, fn: (page: Page) => Promise<void>) {
  test(testInfoTitle, async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await fn(page);
    assertNoConsoleErrors();
  });
}
