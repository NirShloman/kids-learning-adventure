import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { adventureMissions } from '../../src/content/adventureMissions';
import { missionSteps } from '../../src/components/games/experience/adventureEngine';
import { openAdventure, solveMission } from './adventure-helpers';

test.use({ video: 'on' });
for (const game of ['letters', 'numbers', 'shapes', 'colors'] as const) {
  test(`VIS-01 ${game}: animated round with correction, hint and collection`, async ({ page }, info) => {
    const first = adventureMissions.find(m => m.gameId === game)!;
    await openAdventure(page, first, 4, 'medium', { reducedMotion: false, reducedParticles: false });
    const firstStep = missionSteps(first, { age: 4, difficulty: 'medium' }, 137)[0];
    if (firstStep.kind === 'count') await page.getByRole('button', { name: /מגישים/ }).click();
    else {
      const wrong = firstStep.options.find(value => value !== firstStep.answer)!;
      await page.locator(`[data-toy="${wrong}"]`).click();
      await page.locator('[data-drop-zone]').click();
    }
    await expect(page.locator('.adventure-feedback')).toContainText('כמעט');
    await page.getByRole('button', { name: 'רמז', exact: true }).click();
    expect((await new AxeBuilder({ page }).include('.adventure').withTags(['wcag2a', 'wcag2aa']).analyze()).violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`${game}-hint.png`) });
    for (let index = 0; index < 3; index++) {
      const id = await page.getByTestId('adventure').getAttribute('data-mission');
      await solveMission(page, adventureMissions.find(m => m.id === id)!);
      await page.screenshot({ path: info.outputPath(`${game}-success-${index}.png`) });
      await page.locator('.adventure-celebration .adventure-primary').click();
      if (index < 2) await page.locator('.adventure-intro .adventure-primary').click();
    }
    await expect(page.getByTestId('adventure-summary')).toBeVisible();
    await page.locator('.adventure-reward-grid button').first().click();
    await page.screenshot({ path: info.outputPath(`${game}-collection.png`) });
  });
}
