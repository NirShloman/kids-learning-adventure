import { expect, test } from '@playwright/test';
import { installConsoleErrorGuard, openAdmin } from './helpers';

test.describe('local parent and admin flow', () => {
  test('opens protected parent area and Admin content dashboard', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);

    await openAdmin(page);
    await expect(page.locator('.admin-stats')).toBeVisible();
    await expect(page.locator('.admin-list-item').first()).toBeVisible();
    await page.locator('.admin-toolbar select').first().selectOption('letters');
    await page.locator('.admin-toolbar input').fill('אות');
    await expect(page.locator('.admin-preview')).toBeVisible();

    assertNoConsoleErrors();
  });

  test('runs duplicate and review preflight before saving submitted content', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await openAdmin(page);
    const form = page.locator('.admin-form');
    await form.locator('textarea').fill('<img src=x onerror=alert(1)> איזו אות פותחת את המילה אור?');
    await form.getByLabel('מטרה פדגוגית').fill('זיהוי אות פותחת');
    await form.locator('.admin-option-row input:not([type="radio"])').nth(0).fill('א');
    await form.locator('.admin-option-row input:not([type="radio"])').nth(1).fill('ב');
    await form.locator('.admin-option-row input:not([type="radio"])').nth(2).fill('ג');
    await form.getByLabel('תגיות מופרדות בפסיק').fill('letters,initial-sound,e2e');
    await form.getByLabel('רמז').fill('הקשיבו לצליל הראשון.');
    await form.getByLabel('הסבר להורה').fill('תרגול מודעות לצליל פותח.');
    await page.getByRole('button', { name: 'בדיקה לפני שמירה' }).click();

    await expect(form.locator('.admin-duplicate')).toContainText(/כפילות|דומה|לא נמצאה/);
    await expect(form.locator('.admin-review-card')).toContainText('בדיקת איכות');
    expect(dialogs).toEqual([]);
    assertNoConsoleErrors();
  });
});
