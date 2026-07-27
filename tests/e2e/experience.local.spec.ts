import AxeBuilder from '@axe-core/playwright';
import { expect, Locator, Page, test, TestInfo } from '@playwright/test';
import {
  chooseHomeSettings,
  GameTitle,
  installConsoleErrorGuard,
  openGame,
  openLobby,
  selectGameMode
} from './helpers';

type Direction = 'up' | 'down' | 'left' | 'right';
type ExperienceTitle = Extract<GameTitle, 'אותיות' | 'מספרים' | 'צורות' | 'צבעים'>;

test.describe.configure({ timeout: 180_000 });

function isMobile(testInfo: TestInfo) {
  return testInfo.project.name.startsWith('mobile-');
}

async function command(page: Page, direction: Direction, useTouch: boolean, duration = 320) {
  if (useTouch) {
    const button = page.locator(`[data-command="${direction}"]`);
    await button.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 });
    await page.waitForTimeout(duration);
    await button.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 });
    await page.waitForTimeout(90);
    return;
  }
  const key = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight'
  }[direction];
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(90);
}

async function action(page: Page, useTouch: boolean) {
  if (useTouch) await page.locator('[data-command="action"]').click({ force: true });
  else await page.keyboard.press('Space');
}

async function moveDirectlyTo(page: Page, x: number, y: number, useTouch: boolean) {
  const player = page.locator('.experience-player');
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const currentX = Number(await player.getAttribute('data-x'));
    const currentY = Number(await player.getAttribute('data-y'));
    const dx = x - currentX;
    const dy = y - currentY;
    if (Math.hypot(dx, dy) <= 78) return;
    const direction: Direction = Math.abs(dx) > Math.abs(dy)
      ? (dx < 0 ? 'left' : 'right')
      : (dy < 0 ? 'up' : 'down');
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    await command(page, direction, useTouch, Math.min(420, Math.max(150, distance * 1.5)));
  }
  throw new Error(`Player did not reach ${x},${y}`);
}

async function moveTo(page: Page, x: number, y: number, useTouch: boolean) {
  const player = page.locator('.experience-player');
  const currentY = Number(await player.getAttribute('data-y'));
  const crossesCentralWall = (currentY > 340 && y < 280) || (currentY < 280 && y > 340);
  if (crossesCentralWall && await page.locator('.experience-obstacle--wall').count()) {
    await moveDirectlyTo(page, 850, currentY, useTouch);
    await moveDirectlyTo(page, 850, y, useTouch);
  }
  const routedX = Number(await player.getAttribute('data-x'));
  const routedY = Number(await player.getAttribute('data-y'));
  const crossesVerticalWall = (routedX > 330 && x < 210) || (routedX < 210 && x > 330);
  if (
    crossesVerticalWall
    && !(routedY > 365 && y > 365)
    && await page.locator('.experience-obstacle--wall').count() > 1
  ) {
    await moveDirectlyTo(page, routedX, 100, useTouch);
    await moveDirectlyTo(page, x, 100, useTouch);
    await moveDirectlyTo(page, x, y, useTouch);
    return;
  }
  await moveDirectlyTo(page, x, y, useTouch);
}

async function moveToEntity(page: Page, entity: Locator, useTouch: boolean) {
  await moveTo(
    page,
    Number(await entity.getAttribute('data-x')),
    Number(await entity.getAttribute('data-y')),
    useTouch
  );
}

async function expectVisualMove(page: Page, direction: Direction, useTouch: boolean) {
  const player = page.locator('.experience-player');
  const before = await player.boundingBox();
  expect(before).not.toBeNull();
  await command(page, direction, useTouch);
  await expect.poll(async () => await player.boundingBox()).not.toBeNull();
  const after = await player.boundingBox();
  expect(after).not.toBeNull();
  if (direction === 'left') expect(after!.x).toBeLessThan(before!.x - 5);
  if (direction === 'right') expect(after!.x).toBeGreaterThan(before!.x + 5);
  if (direction === 'up') expect(after!.y).toBeLessThan(before!.y - 5);
  if (direction === 'down') expect(after!.y).toBeGreaterThan(before!.y + 5);
}

async function completeCurrentLevel(page: Page, game: ExperienceTitle, useTouch: boolean) {
  if (game === 'צבעים') {
    while (await page.locator('[data-kind="target"]:not(.experience-entity--done)').count()) {
      const target = page.locator('[data-kind="target"]:not(.experience-entity--done)').first();
      const colorId = await target.getAttribute('data-accepts');
      const station = page.locator(`[data-kind="station"][data-entity-id="${colorId}"]`);
      await moveToEntity(page, station, useTouch);
      await action(page, useTouch);
      await moveToEntity(page, target, useTouch);
      await action(page, useTouch);
    }
    return;
  }

  while (await page.locator('[data-kind="collectible"]').count()) {
    const collectible = page.locator('[data-kind="collectible"]').first();
    const accepts = await collectible.getAttribute('data-accepts');
    const target = game === 'צורות'
      ? page.locator(`[data-kind="target"][data-accepts="${accepts}"]:not(.experience-entity--done)`).first()
      : page.locator('[data-kind="target"]').first();
    await moveToEntity(page, collectible, useTouch);
    await action(page, useTouch);
    await moveToEntity(page, target, useTouch);
    await action(page, useTouch);
  }
}

async function completeAllLevels(page: Page, game: ExperienceTitle, useTouch: boolean) {
  for (let level = 0; level < 4; level += 1) {
    await completeCurrentLevel(page, game, useTouch);
    await page.waitForFunction((isColorGame) => {
      if (document.querySelector('.summary-card')) return true;
      return isColorGame
        ? Boolean(document.querySelector('[data-kind="target"]:not(.experience-entity--done)'))
        : Boolean(document.querySelector('[data-kind="collectible"]'));
    }, game === 'צבעים');
    if (await page.locator('.summary-card').isVisible().catch(() => false)) return;
  }
  throw new Error(`Experience ${game} did not reach its summary after four levels.`);
}

async function openExperience(page: Page, title: ExperienceTitle, difficulty: 'easy' | 'hard' = 'easy') {
  await openLobby(page);
  await chooseHomeSettings(page, difficulty === 'easy' ? 3 : 6, difficulty);
  await openGame(page, title);
  await selectGameMode(page, 'experience');
}

async function openExperienceById(
  page: Page,
  gameId: 'letters' | 'numbers' | 'shapes' | 'colors',
  difficulty: 'easy' | 'hard' = 'easy',
  gender: 'boy' | 'girl' = 'girl'
) {
  await openLobby(page, gender);
  await chooseHomeSettings(page, difficulty === 'easy' ? 3 : 6, difficulty);
  const card = page.locator(`.game-card[data-game-id="${gameId}"]`);
  await expect(card).toBeVisible();
  await card.getByRole('button').click();
  const skip = page.locator('.game-entry__skip');
  if (await skip.isVisible().catch(() => false)) {
    await skip.evaluate((element: HTMLElement) => element.click());
  }
  await selectGameMode(page, 'experience');
}

test.describe('visual direction contract', () => {
  test('keyboard arrows move in their physical screen direction', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'Physical keyboard behavior is covered by desktop projects.');
    await openExperience(page, 'אותיות');
    const arena = page.locator('[data-testid="experience-arena"]');
    await expect(arena).toBeFocused();
    await expectVisualMove(page, 'right', false);
    await expectVisualMove(page, 'left', false);
    await expectVisualMove(page, 'up', false);
    await expectVisualMove(page, 'down', false);
  });

  test('WASD moves continuously, then friction slows and stops the character', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'The deterministic velocity curve is sampled once.');
    await openExperience(page, 'אותיות');
    const player = page.locator('.experience-player');
    const before = Number(await player.getAttribute('data-x'));
    await page.keyboard.down('d');
    await page.waitForTimeout(180);
    const duringFirst = Number(await player.getAttribute('data-x'));
    await page.waitForTimeout(180);
    const duringSecond = Number(await player.getAttribute('data-x'));
    expect(duringFirst).toBeGreaterThan(before);
    expect(duringSecond).toBeGreaterThan(duringFirst);
    await page.keyboard.up('d');
    await expect.poll(async () => Number(await player.getAttribute('data-speed')), {
      timeout: 2_500
    }).toBeLessThan(1);
    const stopped = Number(await player.getAttribute('data-x'));
    await page.waitForTimeout(180);
    expect(Math.abs(Number(await player.getAttribute('data-x')) - stopped)).toBeLessThan(1);
  });

  test('touch arrows are laid out and move in their physical direction', async ({ page }) => {
    await openExperience(page, 'אותיות');
    const left = await page.locator('[data-command="left"]').boundingBox();
    const actionButton = await page.locator('[data-command="action"]').boundingBox();
    const right = await page.locator('[data-command="right"]').boundingBox();
    expect(left).not.toBeNull();
    expect(actionButton).not.toBeNull();
    expect(right).not.toBeNull();
    expect(left!.x).toBeLessThan(actionButton!.x);
    expect(right!.x).toBeGreaterThan(actionButton!.x);
    await expectVisualMove(page, 'right', true);
    await expectVisualMove(page, 'left', true);
    await expectVisualMove(page, 'up', true);
    await expectVisualMove(page, 'down', true);
  });

  test('game keys do not scroll and movement stays inside the arena', async ({ page }, testInfo) => {
    await openExperience(page, 'אותיות');
    const useTouch = isMobile(testInfo);
    const arena = page.locator('[data-testid="experience-arena"]');
    const scrollBefore = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    for (let index = 0; index < 8; index += 1) await command(page, 'left', useTouch);
    for (let index = 0; index < 8; index += 1) await command(page, 'up', useTouch);
    if (!useTouch) await action(page, false);
    const scrollAfter = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    if (!useTouch) expect(scrollAfter).toEqual(scrollBefore);
    else expect(scrollAfter.x).toBe(scrollBefore.x);
    const arenaBox = await arena.boundingBox();
    const playerBox = await page.locator('.experience-player').boundingBox();
    expect(arenaBox).not.toBeNull();
    expect(playerBox).not.toBeNull();
    expect(playerBox!.x).toBeGreaterThanOrEqual(arenaBox!.x);
    expect(playerBox!.y).toBeGreaterThanOrEqual(arenaBox!.y);
    expect(playerBox!.x + playerBox!.width).toBeLessThanOrEqual(arenaBox!.x + arenaBox!.width);
    expect(playerBox!.y + playerBox!.height).toBeLessThanOrEqual(arenaBox!.y + arenaBox!.height);
  });

  test('leaving the experience removes its keyboard interception', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'Listener cleanup is independent of the browser engine.');
    await openExperience(page, 'אותיות');
    await page.getByRole('button', { name: 'חזרה לתפריט' }).click();
    await expect(page.locator('[data-testid="experience-arena"]')).toHaveCount(0);
    const defaultPrevented = await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true
      });
      document.body.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(defaultPrevented).toBe(false);
  });

  test('hard-mode wall blocks movement and its soft bumper keeps moving', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'Matter collision behavior is sampled once in-browser and stress-tested in unit tests.');
    await openExperienceById(page, 'letters', 'hard');
    const player = page.locator('.experience-player');
    const bumper = page.locator('.experience-obstacle--bumper');
    await expect(bumper).toBeVisible();
    const bumperBefore = await bumper.getAttribute('style');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(2_400);
    await page.keyboard.up('ArrowUp');
    await expect.poll(async () => Number(await player.getAttribute('data-speed'))).toBeLessThan(1);
    const playerY = Number(await player.getAttribute('data-y'));
    expect(Number.isFinite(playerY)).toBe(true);
    expect(playerY).toBeGreaterThanOrEqual(345);
    await expect.poll(async () => await bumper.getAttribute('style')).not.toBe(bumperBefore);
  });
});

for (const game of ['אותיות', 'מספרים', 'צורות', 'צבעים'] as const) {
  test(`completes ${game} in easy mode with the device's primary input`, async ({ page }, testInfo) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await openExperience(page, game);
    await completeAllLevels(page, game, isMobile(testInfo));
    await expect(page.locator('.summary-card')).toBeVisible();
    await expect(page.locator('.stars__active')).toHaveCount(3);
    const latestSession = await page.evaluate(() => {
      const sessions = JSON.parse(localStorage.getItem('lomdim-bekef.sessions.v1') ?? '[]');
      return sessions[0];
    });
    expect(latestSession.mode).toBe('experience');
    assertNoConsoleErrors();
  });

  test(`completes ${game} in hard mode with continuous input`, async ({ page }, testInfo) => {
    test.skip(!['local-chromium', 'mobile-chrome'].includes(testInfo.project.name), 'Hard completion runs once per primary input type.');
    test.setTimeout(300_000);
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await openExperience(page, game, 'hard');
    await completeAllLevels(page, game, isMobile(testInfo));
    await expect(page.locator('.summary-card')).toBeVisible();
    await expect(page.locator('.stars__active')).toHaveCount(3);
    assertNoConsoleErrors();
  });
}

test.describe('game rules and resilience', () => {
  test('wrong shape target returns the piece without losing progress', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'One deterministic behavioral run is sufficient.');
    await openExperience(page, 'צורות');
    const square = page.locator('[data-entity-id="square"]');
    const wrongTarget = page.locator('[data-entity-id="slot-triangle"]');
    await moveToEntity(page, square, false);
    await action(page, false);
    await moveToEntity(page, wrongTarget, false);
    await action(page, false);
    await expect(square).toBeVisible();
    await expect(page.locator('.experience-game__carry strong')).toHaveText('—');
    await expect(page.locator('.game-world__status strong')).toHaveText('0');
  });

  test('wrong color clears the brush and preserves completed objects', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'One deterministic behavioral run is sufficient.');
    await openExperience(page, 'צבעים');
    const red = page.locator('[data-entity-id="red"]');
    const blueFlower = page.locator('[data-entity-id="flower-blue"]');
    await moveToEntity(page, red, false);
    await action(page, false);
    await moveToEntity(page, blueFlower, false);
    await action(page, false);
    await expect(page.locator('.experience-game__carry strong')).toHaveText('—');
    await expect(blueFlower).not.toHaveClass(/experience-entity--done/);
  });

  test('hard content opens and remains playable for every game', async ({ page }, testInfo) => {
    test.skip(!['local-chromium', 'mobile-chrome'].includes(testInfo.project.name), 'Hard-mode sampling runs on one desktop and one mobile engine.');
    for (const game of ['אותיות', 'מספרים', 'צורות', 'צבעים'] as const) {
      await openExperience(page, game, 'hard');
      await expect(page.locator('[data-testid="experience-arena"]')).toBeVisible();
      await expect(page.locator('[data-kind="target"]').first()).toBeVisible();
      await page.getByRole('button', { name: 'חזרה לתפריט' }).click();
    }
  });
});

test.describe('input lifecycle and detailed game rules', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'Detailed deterministic rules run once; cross-browser completion is covered separately.');
  });

  test('loads the profile character and exposes real movement and action animation states', async ({ page }) => {
    for (const gender of ['boy', 'girl'] as const) {
      await openExperienceById(page, 'letters', 'easy', gender);
      const character = page.locator('.experience-character');
      await expect(character).toHaveAttribute('data-gender', gender);
      await expect(character).toHaveAttribute('data-animation', 'idle');
      await page.keyboard.down('ArrowRight');
      await expect(character).toHaveAttribute('data-animation', 'walk');
      await page.keyboard.up('ArrowRight');
      await expect(character).toHaveAttribute('data-animation', 'idle');

      const collectible = page.locator('[data-kind="collectible"]').first();
      await moveToEntity(page, collectible, false);
      await action(page, false);
      await expect(character).toHaveAttribute('data-animation', 'pickup');
      await expect(character).toHaveAttribute('data-facing', /front|back|left|right/);
      await page.waitForTimeout(500);
      await page.keyboard.down('ArrowRight');
      await expect(character).toHaveAttribute('data-animation', 'carry-walk');
      await page.keyboard.up('ArrowRight');
      await moveToEntity(page, page.locator('[data-kind="target"]').first(), false);
      await action(page, false);
      await expect(character).toHaveAttribute('data-animation', 'drop');
    }
  });

  test('requires profile completion instead of choosing a fallback character', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('lomdim-bekef.learner.v1', JSON.stringify({
        schemaVersion: 2,
        name: 'נועם',
        gender: null,
        profileCompleted: true,
        age: 4,
        difficulty: 'easy',
        voiceEnabled: false,
        narrationEnabled: false,
        soundEffectsEnabled: false,
        migratedFromLegacy: false,
        updatedAt: new Date().toISOString()
      }));
    });
    await page.goto('/');
    await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
    const card = page.locator('.game-card[data-game-id="letters"]');
    await card.getByRole('button').click();
    const skip = page.locator('.game-entry__skip');
    if (await skip.isVisible().catch(() => false)) {
      await skip.evaluate((element: HTMLElement) => element.click());
    }
    await page.locator('.game-mode-card--featured').click();
    await expect(page.locator('#learner-name')).toBeVisible();
    await expect(page.locator('.experience-character')).toHaveCount(0);
  });

  test('ignores repeated keys, blocks celebration input, and supports replay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openExperienceById(page, 'letters');
    const arena = page.locator('[data-testid="experience-arena"]');
    const player = page.locator('.experience-player');

    const beforeRepeat = await player.boundingBox();
    await arena.dispatchEvent('keydown', { key: 'ArrowLeft', repeat: true });
    expect(await player.boundingBox()).toEqual(beforeRepeat);

    while (await page.locator('[data-kind="collectible"]').count()) {
      const collectible = page.locator('[data-kind="collectible"]').first();
      await moveToEntity(page, collectible, false);
      await action(page, false);
      await moveToEntity(page, page.locator('[data-kind="target"]').first(), false);
      await action(page, false);
    }

    await expect(page.locator('.experience-character')).toHaveAttribute('data-animation', 'celebrate');
    await expect(page.locator('.experience-controls__button').first()).toBeDisabled();
    const celebrationPosition = {
      x: await player.getAttribute('data-x'),
      y: await player.getAttribute('data-y')
    };
    await arena.dispatchEvent('keydown', { key: 'ArrowRight', repeat: false });
    await page.locator('[data-command="left"]').click({ force: true });
    expect(Number(await player.getAttribute('data-x'))).toBeCloseTo(Number(celebrationPosition.x), 3);
    expect(Number(await player.getAttribute('data-y'))).toBeCloseTo(Number(celebrationPosition.y), 3);

    await expect(page.locator('.summary-card')).toBeVisible();
    await page.locator('.summary-card__actions button').first().click();
    await expect(arena).toBeVisible();
    await expect(page.locator('.game-world__status strong')).toHaveText('0');
  });

  test('numbers count exactly once and reject a second item while carrying', async ({ page }) => {
    await openExperienceById(page, 'numbers');
    const first = page.locator('[data-kind="collectible"]').first();
    const firstId = await first.getAttribute('data-entity-id');
    await moveToEntity(page, first, false);
    await action(page, false);
    await expect(page.locator(`[data-entity-id="${firstId}"]`)).toHaveCount(0);

    const second = page.locator('[data-kind="collectible"]').first();
    const secondId = await second.getAttribute('data-entity-id');
    await moveToEntity(page, second, false);
    await action(page, false);
    await expect(page.locator(`[data-entity-id="${secondId}"]`)).toBeVisible();
    await expect(page.locator('.game-world__status strong')).toHaveText('0');

    await moveToEntity(page, page.locator('[data-kind="target"]').first(), false);
    await action(page, false);
    await expect(page.locator('.game-world__status strong')).toHaveText('1');
    await action(page, false);
    await expect(page.locator('.game-world__status strong')).toHaveText('1');
  });

  test('a completed shape target rejects another piece without changing progress', async ({ page }) => {
    await openExperienceById(page, 'shapes');
    const square = page.locator('[data-entity-id="square"]');
    const squareTarget = page.locator('[data-entity-id="slot-square"]');
    await moveToEntity(page, square, false);
    await action(page, false);
    await moveToEntity(page, squareTarget, false);
    await action(page, false);
    await expect(squareTarget).toHaveClass(/experience-entity--done/);
    await expect(page.locator('.game-world__status strong')).toHaveText('1');

    const triangle = page.locator('[data-entity-id="triangle"]');
    await moveToEntity(page, triangle, false);
    await action(page, false);
    await moveToEntity(page, squareTarget, false);
    await action(page, false);
    await expect(triangle).toHaveCount(0);
    await expect(page.locator('.experience-game__carry .experience-sprite')).toHaveCount(1);
    await expect(squareTarget).toHaveClass(/experience-entity--done/);
    await expect(page.locator('.game-world__status strong')).toHaveText('1');
  });

  test('switches paint colors, clears a wrong color, and preserves a painted object', async ({ page }) => {
    await openExperienceById(page, 'colors');
    const red = page.locator('[data-entity-id="red"]');
    const blue = page.locator('[data-entity-id="blue"]');
    const blueFlower = page.locator('[data-entity-id="flower-blue"]');
    const redFlower = page.locator('[data-entity-id="flower-red"]');

    await moveToEntity(page, red, false);
    await action(page, false);
    await moveToEntity(page, blue, false);
    await action(page, false);
    await moveToEntity(page, blueFlower, false);
    await action(page, false);
    await expect(blueFlower).toHaveClass(/experience-entity--done/);
    await expect(blueFlower).toHaveCSS('background-color', 'rgb(66, 165, 245)');
    const paintedBackground = await blueFlower.evaluate((element) => getComputedStyle(element).backgroundColor);

    await moveToEntity(page, blue, false);
    await action(page, false);
    await moveToEntity(page, redFlower, false);
    await action(page, false);
    await expect(page.locator('.experience-game__carry strong').locator('.experience-sprite, .experience-entity__image')).toHaveCount(0);
    await expect(blueFlower).toHaveCSS('background-color', paintedBackground);
    await expect(page.locator('.game-world__status strong')).toHaveText('1');
  });
});

test.describe('layout, assets and accessibility', () => {
  test('has no horizontal overflow, broken sprite, undersized controls, or critical axe violations', async ({ page }) => {
    const failedImages: string[] = [];
    page.on('response', (response) => {
      if (response.request().resourceType() === 'image' && !response.ok()) failedImages.push(response.url());
    });
    await openExperience(page, 'מספרים');
    expect(failedImages).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth)
    );
    const spriteUrl = await page.locator('.experience-sprite').first().evaluate((element) =>
      getComputedStyle(element).backgroundImage
    );
    expect(spriteUrl).toContain('experience-sprites.png');
    const spriteSource = spriteUrl.match(/url\(["']?(.*?)["']?\)/)?.[1];
    expect(spriteSource).toBeTruthy();
    const spriteDimensions = await page.evaluate((source) => new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error(`Unable to load ${source}`));
      image.src = source!;
    }), spriteSource);
    expect(spriteDimensions.width).toBeGreaterThan(0);
    expect(spriteDimensions.height).toBeGreaterThan(0);
    const characterUrl = await page.locator('.experience-character').evaluate((element) =>
      getComputedStyle(element).backgroundImage
    );
    expect(characterUrl).toContain('character-sprites-v2.png');
    const characterSource = characterUrl.match(/url\(["']?(.*?)["']?\)/)?.[1];
    expect(characterSource).toBeTruthy();
    const characterDimensions = await page.evaluate((source) => new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error(`Unable to load ${source}`));
      image.src = source!;
    }), characterSource);
    expect(characterDimensions.width).toBeGreaterThan(0);
    expect(characterDimensions.height).toBeGreaterThan(0);
    for (const image of await page.locator('.experience-entity img').all()) {
      const imageState = await image.evaluate((element: HTMLImageElement) => ({
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        objectFit: getComputedStyle(element).objectFit
      }));
      expect(imageState.naturalWidth).toBeGreaterThan(0);
      expect(imageState.naturalHeight).toBeGreaterThan(0);
      expect(imageState.objectFit).toBe('contain');
    }
    for (const button of await page.locator('.experience-controls__button').all()) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }
    const results = await new AxeBuilder({ page }).include('.experience-game').analyze();
    expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
  });

  test('390x844 fits the arena and controls; 320x568 scrolls vertically without horizontal overflow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'Explicit viewport contracts need one deterministic browser engine.');

    for (const viewport of [
      { width: 390, height: 844, shouldFitVertically: true },
      { width: 320, height: 568, shouldFitVertically: false },
      { width: 844, height: 390, shouldFitVertically: false }
    ]) {
      await page.setViewportSize(viewport);
      await openLobby(page);
      await chooseHomeSettings(page, 3, 'easy');
      const lettersCard = page.locator('.game-card[data-game-id="letters"]');
      await expect(lettersCard).toBeVisible();
      await lettersCard.getByRole('button').click();
      const skip = page.locator('.game-entry__skip');
      if (await skip.isVisible().catch(() => false)) {
        await skip.evaluate((element: HTMLElement) => element.click());
      }
      await selectGameMode(page, 'experience');

      const dimensions = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight
      }));
      expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
      if (viewport.shouldFitVertically) {
        expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight + 2);
      } else {
        expect(dimensions.documentHeight).toBeGreaterThan(dimensions.viewportHeight);
      }

      const arena = await page.locator('[data-testid="experience-arena"]').boundingBox();
      const controls = await page.locator('.experience-controls').boundingBox();
      expect(arena).not.toBeNull();
      expect(controls).not.toBeNull();
      expect(arena!.y + arena!.height).toBeLessThanOrEqual(controls!.y);

      for (const button of await page.locator('.game-world button:visible').all()) {
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(48);
        expect(box!.height).toBeGreaterThanOrEqual(48);
      }
    }
  });

  test('resizing the arena updates its render scale without changing world coordinates', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'local-chromium', 'ResizeObserver behavior is engine-independent.');
    await page.setViewportSize({ width: 390, height: 844 });
    await openExperienceById(page, 'letters');
    const arena = page.locator('[data-testid="experience-arena"]');
    const player = page.locator('.experience-player');
    await expect.poll(async () => Number(await arena.getAttribute('data-render-width'))).toBeGreaterThan(0);
    const widthBefore = Number(await arena.getAttribute('data-render-width'));
    const positionBefore = {
      x: Number(await player.getAttribute('data-x')),
      y: Number(await player.getAttribute('data-y'))
    };
    await page.setViewportSize({ width: 900, height: 650 });
    await expect.poll(async () => Number(await arena.getAttribute('data-render-width'))).not.toBe(widthBefore);
    await expect.poll(async () => Number(await player.getAttribute('data-speed'))).toBeLessThan(1);
    expect(Number(await player.getAttribute('data-x'))).toBeCloseTo(positionBefore.x, 1);
    expect(Number(await player.getAttribute('data-y'))).toBeCloseTo(positionBefore.y, 1);
  });
});
