import { expect, Page, test } from '@playwright/test';
import { chooseHomeSettings, openGame, openLobby, selectGameMode } from './helpers';

const visualProjects = ['local-chromium', 'mobile-chrome'];

test.describe.configure({ timeout: 180_000 });

async function prepare(
  page: Page,
  title: 'אותיות' | 'מספרים' | 'צורות' | 'צבעים',
  gender: 'boy' | 'girl' = 'girl'
) {
  await openLobby(page, gender);
  await chooseHomeSettings(page, 3, 'easy');
  await openGame(page, title);
}

async function moveKeyboardTo(page: Page, entitySelector: string) {
  const player = page.locator('.experience-player');
  const entity = page.locator(entitySelector).first();
  const targetX = Number(await entity.getAttribute('data-x'));
  const targetY = Number(await entity.getAttribute('data-y'));
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const x = Number(await player.getAttribute('data-x'));
    const y = Number(await player.getAttribute('data-y'));
    const dx = targetX - x;
    const dy = targetY - y;
    if (Math.hypot(dx, dy) <= 52) return;
    const key = Math.abs(dx) > Math.abs(dy)
      ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight')
      : (dy < 0 ? 'ArrowUp' : 'ArrowDown');
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.min(420, Math.max(150, distance * 1.5)));
    await page.keyboard.up(key);
    await page.waitForTimeout(90);
  }
  throw new Error(`Player did not reach ${entitySelector}`);
}

async function screenshotWorld(page: Page, name: string) {
  await expect(page.locator('.game-world')).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.012
  });
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!visualProjects.includes(testInfo.project.name), 'Golden screenshots run on deterministic Chromium desktop and mobile projects.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('mode selector visual baseline', async ({ page }) => {
  await prepare(page, 'אותיות');
  await screenshotWorld(page, 'experience-mode-selector');
});

test('boy character visual baseline', async ({ page }) => {
  await prepare(page, 'אותיות', 'boy');
  await selectGameMode(page, 'experience');
  await expect(page.locator('.experience-character')).toHaveAttribute('data-gender', 'boy');
  await screenshotWorld(page, 'experience-boy-character');
});

test('boy and girl walking visual baselines', async ({ page }) => {
  for (const gender of ['boy', 'girl'] as const) {
    await prepare(page, 'אותיות', gender);
    await selectGameMode(page, 'experience');
    const character = page.locator('.experience-character');
    await page.keyboard.down('ArrowRight');
    await expect(character).toHaveAttribute('data-animation', 'walk');
    await screenshotWorld(page, `experience-${gender}-walking`);
    await page.keyboard.up('ArrowRight');
  }
});

test('opening state visual baselines for all experiential games', async ({ page }) => {
  for (const [title, slug] of [
    ['אותיות', 'letters'],
    ['מספרים', 'numbers'],
    ['צורות', 'shapes'],
    ['צבעים', 'colors']
  ] as const) {
    await prepare(page, title);
    await selectGameMode(page, 'experience');
    await screenshotWorld(page, `experience-${slug}-start`);
  }
});

test('representative interaction states visual baselines', async ({ page }) => {
  await prepare(page, 'אותיות');
  await selectGameMode(page, 'experience');
  await moveKeyboardTo(page, '[data-kind="collectible"]');
  await page.keyboard.press('Space');
  await screenshotWorld(page, 'experience-letters-carrying');

  await prepare(page, 'מספרים');
  await selectGameMode(page, 'experience');
  await moveKeyboardTo(page, '[data-kind="collectible"]');
  await page.keyboard.press('Space');
  await moveKeyboardTo(page, '[data-kind="target"]');
  await page.keyboard.press('Space');
  await screenshotWorld(page, 'experience-numbers-counting');

  await prepare(page, 'צורות');
  await selectGameMode(page, 'experience');
  await moveKeyboardTo(page, '[data-entity-id="square"]');
  await page.keyboard.press('Space');
  await moveKeyboardTo(page, '[data-entity-id="slot-triangle"]');
  await page.keyboard.press('Space');
  await screenshotWorld(page, 'experience-shapes-wrong-target');

  await prepare(page, 'צבעים');
  await selectGameMode(page, 'experience');
  await moveKeyboardTo(page, '[data-entity-id="red"]');
  await page.keyboard.press('Space');
  await moveKeyboardTo(page, '[data-entity-id="flower-red"]');
  await page.keyboard.press('Space');
  await screenshotWorld(page, 'experience-colors-painted');
});

test('success and summary visual baselines', async ({ page }) => {
  await prepare(page, 'אותיות');
  await selectGameMode(page, 'experience');
  for (let index = 0; index < 3; index += 1) {
    await moveKeyboardTo(page, '[data-kind="collectible"]');
    await page.keyboard.press('Space');
    await moveKeyboardTo(page, '[data-kind="target"]');
    await page.keyboard.press('Space');
  }
  await expect(page.locator('.experience-controls__button').first()).toBeDisabled();
  await screenshotWorld(page, 'experience-success');
  await expect(page.locator('.summary-card')).toBeVisible();
  await expect(page.locator('.summary-card')).toHaveScreenshot('experience-summary.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.012
  });
});
