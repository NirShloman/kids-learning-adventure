import { finishDetective, solveDetectiveStep } from './detective-helpers';
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
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

export async function completeProfileSetup(page: Page, gender: 'boy' | 'girl' = 'girl') {
  const nameInput = page.locator('#learner-name');
  if (!await nameInput.isVisible().catch(() => false)) return;
  await nameInput.fill('נועה');
  await page.getByRole('button', {name:'ממשיכים',exact:true}).click();
  await page.locator('.profile-setup__gender button').nth(gender === 'boy' ? 0 : 1).click();
  await page.getByRole('button', {name:'ממשיכים',exact:true}).click();
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
  await page.getByRole('button',{name:'⚙️ צלילים'}).click();
  await page.getByLabel('🔊 הקראה',{exact:true}).uncheck();
  await page.getByRole('button',{name:'🎲 משחקים'}).click();
}

export async function chooseHomeSettings(page: Page, age: number, difficultyValue: 'easy' | 'medium' | 'hard') {
  await page.locator('.shell-menu > summary').click();
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
  if (!await card.count()) await page.getByRole('button',{name:'לעמוד הבא',exact:true}).click();
  await expect(card).toBeVisible();
  await card.click();
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
    ? page.locator('[data-testid="adventure"]')
    : page.locator('[data-testid="quiz-option"]').first()).toBeVisible({timeout:20_000});
}

export async function expectNoUnavailableContent(page: Page) {
  await expect(page.getByText(/אין .* זמינ/)).toHaveCount(0);
  await expect(page.getByText('התוכן לא נטען')).toHaveCount(0);
}

export async function completeChoiceGame(page: Page, _optionTestId: string, _nextButtonName: RegExp, answerCorrect = true) {
  for (let index = 0; index < 16; index++) {
    if (await page.locator('.summary-card').isVisible().catch(() => false)) return;
    if (!answerCorrect) {
      const wrong = page.locator('.detective-answer[data-correct="false"]:enabled').first();
      if (await wrong.count()) await wrong.click();
    }
    await solveDetectiveStep(page);
  }
  await expect(page.locator('.summary-card')).toBeVisible();
}
export async function completeMatchingGame(page: Page) { await finishDetective(page); }
export async function completeMemoryGame(page: Page) { await finishDetective(page); }
