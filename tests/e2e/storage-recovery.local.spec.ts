import { expect, test } from '@playwright/test';
import { openLobby } from './helpers';

test('retains unsaved preferences and retries without losing the active profile', async ({ page }) => {
  await openLobby(page);
  await page.getByRole('button', { name: '⚙️ צלילים' }).click();
  const before = await page.evaluate(() => localStorage.getItem('lomdim-bekef.learning.v4'));
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let fail = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'lomdim-bekef.learning.v4' && fail) {
        fail = false;
        throw new DOMException('Test storage full', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
  });
  await page.getByLabel('🎶 מוזיקה', { exact: true }).uncheck();
  await expect(page.getByRole('heading', { name: 'צריך עזרה ממבוגר כדי לשמור' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lomdim-bekef.learning.v4'))).toBe(before);
  await page.getByRole('button', { name: 'ניסיון נוסף', exact: true }).click();
  await expect(page.locator('.app-recovery')).toHaveCount(0);
  await expect(page.getByLabel('🎶 מוזיקה', { exact: true })).not.toBeChecked();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!));
  const prior = JSON.parse(before!);
  expect(saved.activeProfileId).toBe(prior.activeProfileId);
  expect(saved.profiles[0].musicEnabled).toBe(false);
});

test('shows recovery and preserves a corrupt snapshot', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lomdim-bekef.learning.v4', '{corrupted-test'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'משהו לא נטען כמו שצריך' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lomdim-bekef.learning.v4'))).toBe('{corrupted-test');
});

test('retries initialization after storage access fails', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    let fail = true;
    Storage.prototype.getItem = function (key) {
      if (key === 'lomdim-bekef.learning.v4' && fail) {
        fail = false;
        throw new DOMException('Test unavailable storage', 'SecurityError');
      }
      return original.call(this, key);
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'משהו לא נטען כמו שצריך' })).toBeVisible();
  await page.getByRole('button', { name: 'ניסיון נוסף', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'עולמיה', exact: true })).toBeVisible();
});
