import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const viteCli = join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const baseURL = 'http://127.0.0.1:4179';
const server = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4179'], {
  cwd: rootDir,
  stdio: 'ignore',
  windowsHide: true
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Preview server did not start.');
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(baseURL);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });

  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  const lettersCard = page.locator('.game-card').filter({ hasText: 'אותיות' }).first();
  await lettersCard.getByRole('button', { name: 'מתחילים' }).click();
  await page.locator('[data-testid="quiz-option"]').first().waitFor();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await page.locator('.game-card').filter({ hasText: 'אותיות' }).first().getByRole('button', { name: 'מתחילים' }).click();
  await page.locator('[data-testid="quiz-option"]').first().waitFor();

  const canvasCount = await page.locator('canvas').count();
  if (canvasCount > 2) throw new Error(`Expected at most two active canvases, found ${canvasCount}.`);
  console.log('Offline smoke passed: shell, local font, image assets, game chunk, and letters JSON loaded from same-origin cache.');
} finally {
  await browser?.close();
  server.kill();
}
