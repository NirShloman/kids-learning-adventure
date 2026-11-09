import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective } from './detective-helpers';
import { openAdventure } from './adventure-helpers';
import { adventureMissions } from '../../src/content/adventureMissions';
import { missionSteps } from '../../src/components/games/experience/adventureEngine';

for (const game of ['letters', 'numbers', 'shapes', 'colors', 'patterns', 'sorting'] as const) {
  test(`${game} clears answer marks before retry and on the next question`, async ({ page }) => {
    await bootDetective(page);
    await enterDetective(page, game);
    const wrong = page.locator('.detective-answer[data-correct="false"]').first();
    await wrong.click();
    await expect(wrong).toHaveClass(/option-card--wrong/);
    await expect(page.locator('.option-card--wrong')).toHaveCount(0);
    const correct = page.locator('.detective-answer[data-correct="true"]');
    await correct.click();
    await expect(correct).toHaveClass(/option-card--correct/);
    await expect(page.locator('.option-card--wrong')).toHaveCount(0);
    await expect(page.locator('.detective-chip')).toContainText('2/');
    await expect(page.locator('.option-card--correct, .option-card--wrong')).toHaveCount(0);
    await expect(page.locator('.detective-card h2')).toBeFocused();
    if (test.info().project.name === 'mobile-chrome') {
      // A tap must not leave the browser's emulated hover painted onto the next answer.
      const backgrounds = await page.locator('.detective-answer').evaluateAll(nodes =>
        nodes.map(node => getComputedStyle(node).backgroundColor));
      expect(backgrounds.every(color => color === 'rgb(255, 255, 255)')).toBe(true);
    }
  });
}

test('adventure clears a selected piece after a wrong attempt and after advancing', async ({ page }) => {
  const mission = adventureMissions.find(m => m.gameId === 'shapes' && m.activity === 'shape-build')!;
  await openAdventure(page, mission);
  const step = missionSteps(mission, { age: 4, difficulty: 'medium' }, 137)[0];
  const wrong = step.options.find(value => value !== step.answer)!;
  await page.locator(`[data-toy="${wrong}"]`).click();
  await expect(page.locator('.adventure-toy.is-selected')).toHaveCount(1);
  await page.locator('[data-drop-zone]').click();
  await expect(page.locator('.adventure-toy.is-selected')).toHaveCount(0);
  await page.locator(`[data-toy="${step.answer}"]`).click();
  await page.locator('[data-drop-zone]').click();
  await expect(page.getByTestId('adventure')).not.toHaveAttribute('data-step', step.id);
  await expect(page.locator('.adventure-toy.is-selected, .adventure-toy[aria-pressed="true"]')).toHaveCount(0);
});
