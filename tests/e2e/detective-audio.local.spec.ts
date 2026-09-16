import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective, finishDetective } from './detective-helpers';

const manifest = JSON.parse(readFileSync('src/assets/generatedNarrationManifest.json', 'utf8'));
const completionPath = manifest.entries['סיימנו את התעלומה וגילינו תמונה חדשה. כל הכבוד!']?.localPath;

for (const game of ['letters', 'numbers', 'shapes', 'colors', 'patterns', 'sorting', 'matching', 'memory', 'mixed'] as const) {
  test(`${game}: packaged hint and completion audio decode without missing bindings or late playback`, async ({ page }) => {
    const missing: string[] = [];
    page.on('console', message => { if (message.text().includes('NARRATION_ASSET_MISSING')) missing.push(message.text()); });
    await page.addInitScript(() => {
      const elements = new Set<HTMLMediaElement>();
      const probe = { decoded: [] as string[], overlaps: 0, elements };
      (window as any).__detectiveAudio = probe;
      const original = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (this.src.includes('/audio/narration/')) {
          elements.add(this);
          this.addEventListener('playing', () => {
            if (this.paused || this.ended) return;
            if (this.readyState >= 2) probe.decoded.push(this.src);
            if ([...elements].some(other => other !== this && !other.paused && !other.ended)) probe.overlaps++;
          }, { once: true });
        }
        return original.call(this);
      };
    });
    await bootDetective(page, 3, 'easy', true);
    if (game === 'mixed') {
      await page.getByRole('button', { name: 'מתחילים תרגול מותאם' }).click();
      await expect(page.getByTestId('adaptive-session')).toBeVisible();
    } else await enterDetective(page, game);
    await expect.poll(() => page.evaluate(() => (window as any).__detectiveAudio.decoded.length)).toBeGreaterThan(0);
    const beforeHint = await page.evaluate(() => (window as any).__detectiveAudio.decoded.length);
    await page.getByRole('button', { name: '💡 רמז', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__detectiveAudio.decoded.length)).toBeGreaterThan(beforeHint);
    await finishDetective(page);
    expect(completionPath).toBeTruthy();
    await expect.poll(() => page.evaluate(path => (window as any).__detectiveAudio.decoded.some((url: string) => url.endsWith(path)), completionPath)).toBe(true);
    expect(missing).toEqual([]);
    expect(await page.evaluate(() => (window as any).__detectiveAudio.overlaps)).toBe(0);
    await page.getByRole('button', { name: 'לתפריט המשחקים', exact: true }).click();
    expect(await page.evaluate(path => [...(window as any).__detectiveAudio.elements].filter((audio: any) => audio.src.endsWith(path)).every((audio: any) => audio.paused || audio.ended), completionPath)).toBe(true);
  });
}
