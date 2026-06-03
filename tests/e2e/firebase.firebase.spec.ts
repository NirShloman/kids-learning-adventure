import { expect, test } from '@playwright/test';
import { installConsoleErrorGuard, openAdmin, openGame, openLobby } from './helpers';
import {
  clearE2ECollections,
  createApprovedQuestion,
  expectPendingSubmissionCreated,
  getAdminDb,
  seedApprovedQuestion,
  skipIfFirebaseEmulatorUnavailable
} from './firebaseSupport';

test.describe('Firebase emulator E2E', () => {
  test.beforeEach(async () => {
    await skipIfFirebaseEmulatorUnavailable();
    await clearE2ECollections();
  });

  test('loads approved questions from Firestore emulator into gameplay', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    const question = createApprovedQuestion();
    await seedApprovedQuestion(question);

    await openLobby(page);
    await openGame(page, 'אותיות');

    await expect(page.getByText(question.prompt)).toBeVisible();
    await page.locator('[data-testid="quiz-option"][data-correct="true"]').click();
    await expect(page.getByRole('button', { name: /לשאלה הבאה/ })).toBeEnabled();
    assertNoConsoleErrors();
  });

  test('saves submitted user question only as pending review', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    await seedApprovedQuestion(createApprovedQuestion());

    await openAdmin(page);
    const form = page.locator('.admin-form');
    const prompt = 'בדיקת אמולטור: איזו אות פותחת את המילה אור?';
    await form.locator('textarea').fill(prompt);
    await form.getByLabel('מטרה פדגוגית').fill('בדיקת pending submission');
    await form.locator('.admin-option-row input:not([type="radio"])').nth(0).fill('א');
    await form.locator('.admin-option-row input:not([type="radio"])').nth(1).fill('ב');
    await form.locator('.admin-option-row input:not([type="radio"])').nth(2).fill('ג');
    await form.getByLabel('תגיות מופרדות בפסיק').fill('e2e,pending');
    await form.getByLabel('רמז').fill('הקשיבו לצליל הראשון.');
    await form.getByLabel('הסבר להורה').fill('בדיקת שמירה במסלול בדיקה.');
    await page.getByRole('button', { name: 'שליחה לבדיקה' }).click();

    await expect(page.getByText(/נשמרה במסלול בדיקה|שולחים לבדיקה/)).toBeVisible();
    await expectPendingSubmissionCreated(page, prompt);
    assertNoConsoleErrors();
  });

  test('pending content is invisible until promoted to approved questions', async ({ page }) => {
    const assertNoConsoleErrors = installConsoleErrorGuard(page);
    const pending = createApprovedQuestion({
      id: 'e2e-pending-letter',
      prompt: 'בדיקת אמולטור: שאלה ממתינה שלא מופיעה במשחק',
      status: 'pending_review',
      approvedAt: undefined
    });

    await clearE2ECollections();
    await seedApprovedQuestion(createApprovedQuestion());
    const db = getAdminDb();
    await db.collection('pendingQuestionSubmissions').doc(pending.id).set(pending);

    await openLobby(page);
    await openGame(page, 'אותיות');
    await expect(page.getByText(pending.prompt)).toHaveCount(0);

    await db.collection('questions').doc(pending.id).set({
      ...pending,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await page.reload();
    await page.getByRole('button', { name: /כניסה לתפריט המשחקים/ }).click();
    await openGame(page, 'אותיות');
    await expect(page.getByText(pending.prompt)).toBeVisible();
    assertNoConsoleErrors();
  });
});
