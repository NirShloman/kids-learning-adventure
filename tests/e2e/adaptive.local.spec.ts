import { solveDetectiveStep } from './detective-helpers';
import { expect, test } from '@playwright/test';
import { completeProfileSetup, openLobby } from './helpers';

test.describe('local personalized learning', () => {
  test('starts an adaptive plan and records item-level evidence', async ({ page }) => {
    await openLobby(page);
    await page.getByRole('button', { name: 'מתחילים תרגול מותאם' }).click();
    await expect(page.locator('[data-testid="adaptive-session"]')).toBeVisible();
    await solveDetectiveStep(page);
    await expect(page.locator('.detective-chip')).toContainText('2/');
    const evidenceCount = await page.evaluate(() => {
      const snapshot = JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4') ?? 'null');
      return snapshot.dataByProfile[snapshot.activeProfileId].events.length;
    });
    expect(evidenceCount).toBeGreaterThan(0);
  });

  test('creates, selects and deletes isolated profiles in the parent area', async ({ page }) => {
    await openLobby(page);
    await page.getByRole('button', { name: 'אזור הורים' }).click();
    const prompt = await page.locator('label[for="parent-answer"]').textContent();
    const factors = prompt?.match(/(\d+)\s*×\s*(\d+)/);
    await page.locator('#parent-answer').fill(String(Number(factors?.[1]) * Number(factors?.[2])));
    await page.getByRole('button', { name: 'פתיחת אזור הורים' }).click();
    await page.getByRole('button', { name: 'הוספת פרופיל' }).click();
    await completeProfileSetup(page);
    await page.getByRole('button', { name: 'אזור הורים' }).click();
    const secondPrompt=await page.locator('label[for="parent-answer"]').textContent();
    const secondFactors=secondPrompt?.match(/(\d+)\s*×\s*(\d+)/);
    await page.locator('#parent-answer').fill(String(Number(secondFactors?.[1])*Number(secondFactors?.[2])));
    await page.getByRole('button',{name:'פתיחת אזור הורים'}).click();
    await expect(page.locator('.profile-chip')).toHaveCount(2);
    await page.locator('.accessibility-grid').getByText('ניגודיות גבוהה').click();
    await expect(page.locator('html')).toHaveAttribute('data-high-contrast', 'true');
    await page.locator('.profile-chip').first().getByRole('button').first().click();
    await expect(page.locator('.profile-chip').first()).toHaveClass(/is-active/);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('.profile-chip').last().getByRole('button',{name:/מחיקת הפרופיל/}).click();
    await expect(page.locator('.profile-chip')).toHaveCount(1);
  });

  test('offers both non-competitive shared-play modes', async ({ page }) => {
    await openLobby(page);
    await page.getByRole('button', { name: 'משחקים יחד באותו מכשיר' }).click();
    await expect(page.getByRole('button', { name: /שני ילדים בתורות/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /הורה וילד/ })).toBeVisible();
  });
});
