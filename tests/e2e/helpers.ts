import { expect, Locator, Page } from '@playwright/test';

export type GameTitle = 'אותיות' | 'מספרים' | 'צורות' | 'צבעים' | 'התאמה' | 'זיכרון' | 'רצפים' | 'מיון וסיווג';
export type ExperienceMode = 'experience' | 'quiz';

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

export async function completeProfileSetup(page: Page, gender: 'boy' | 'girl' = 'girl') {
  const nameInput = page.locator('#learner-name');
  if (!await nameInput.isVisible().catch(() => false)) return;
  await nameInput.fill('נועה');
  await page.locator('.profile-setup__gender button').nth(gender === 'boy' ? 0 : 1).click();
  await page.locator('#learner-age').selectOption('4');
  await page.locator('#learner-difficulty').selectOption('medium');
  await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
}

export async function openLobby(page: Page, gender: 'boy' | 'girl' = 'girl') {
  await gotoFreshApp(page);
  // The branded Hebrew display name can change independently of onboarding.
  // The landing-page h1 is the stable semantic readiness signal.
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await completeProfileSetup(page, gender);
  await expect(page.locator('.home-grid')).toBeVisible();
  await page.locator('#learner-voice').uncheck({ force: true });
}

export async function chooseHomeSettings(page: Page, age: number, difficultyValue: 'easy' | 'medium' | 'hard') {
  await page.getByRole('button', { name: 'אזור הורים' }).click();
  const prompt = await page.locator('label[for="parent-answer"]').textContent();
  const factors = prompt?.match(/(\d+)\s*×\s*(\d+)/);
  expect(factors).not.toBeNull();
  await page.locator('#parent-answer').fill(String(Number(factors![1]) * Number(factors![2])));
  await page.getByRole('button', { name: 'פתיחת אזור הורים' }).click();
  await page.locator('#learner-age').selectOption(String(age));
  await page.locator('#learner-difficulty').selectOption(difficultyValue);
  await page.getByRole('button', { name: 'שמירת פרופיל והגדרות' }).click();
  await page.getByRole('button', { name: 'חזרה לאפליקציה' }).click();
}

export async function openGame(page: Page, title: GameTitle) {
  const card = page.locator('.game-card').filter({ hasText: title }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'מתחילים' }).click();
  const skip = page.getByRole('button', { name: 'דלגו למשחק' });
  if (await skip.isVisible().catch(() => false)) await activate(skip).catch(() => undefined);
  await expect(page.locator('.game-world')).toBeVisible();
}

export async function selectGameMode(page: Page, mode: ExperienceMode) {
  const selector = mode === 'experience'
    ? page.locator('.game-mode-card--featured')
    : page.locator('.game-mode-card:not(.game-mode-card--featured)');
  await expect(selector).toBeVisible();
  await selector.click();
  await expect(mode === 'experience'
    ? page.locator('[data-testid="experience-arena"]')
    : page.locator('[data-testid="quiz-option"]').first()).toBeVisible();
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
