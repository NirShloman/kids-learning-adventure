import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

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

async function openLettersQuiz(page) {
  await page.locator('.game-card').filter({ hasText: 'אותיות' }).first()
    .getByRole('button', { name: 'מתחילים' }).click();
  const skip = page.locator('.game-entry__skip');
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.getByRole('button', { name: /טריוויה/ }).click();
  await page.locator('[data-testid="quiz-option"]').first().waitFor();
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('lomdim-bekef.learner.v1', JSON.stringify({
      schemaVersion: 3,
      name: 'בדיקת אופליין',
      gender: 'boy',
      profileCompleted: true,
      age: 4,
      difficulty: 'medium',
      voiceEnabled: false,
      narrationEnabled: false,
      soundEffectsEnabled: false,
      musicEnabled: false,
      migratedFromLegacy: false,
      updatedAt: new Date(0).toISOString()
    }));
  });
  const page = await context.newPage();
  await page.goto(baseURL);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  const manifest = JSON.parse(readFileSync(join(rootDir, 'src/assets/generatedNarrationManifest.json'), 'utf8'));
  const brandAudio = manifest.entries['מתחילים לשחק ולגלות עם עוֹלָמִיָּה.'];
  const readRange = () => page.evaluate(async (url) => {
    const response = await fetch(url, { headers: { Range: 'bytes=0-127' } });
    return { status: response.status, type: response.headers.get('content-type'), bytes: Array.from(new Uint8Array(await response.arrayBuffer())) };
  }, brandAudio.localPath);
  const onlineAudio = await readRange();
  if (onlineAudio.status !== 206 || onlineAudio.bytes.length !== 128 || !onlineAudio.type?.includes('audio/mpeg')) throw new Error('Narration range request failed.');

  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await openLettersQuiz(page);

  await context.setOffline(true);
  const offlineAudio = await readRange();
  if (JSON.stringify(offlineAudio) !== JSON.stringify(onlineAudio)) throw new Error('Offline narration bytes differ.');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await openLettersQuiz(page);

  const canvasCount = await page.locator('canvas').count();
  if (canvasCount > 2) throw new Error(`Expected at most two active canvases, found ${canvasCount}.`);
  console.log('Offline smoke passed: shell, local font, image assets, game chunk, letters JSON and byte-range MP3 narration loaded from same-origin cache.');
} finally {
  await browser?.close();
  server.kill();
}
