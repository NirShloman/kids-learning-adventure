import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective, finishDetective, solveDetectiveStep } from './detective-helpers';
for(const game of ['letters','numbers','shapes','colors','patterns','sorting','matching','memory'] as const) {
  test(`${game}: prepared production session resumes and finishes offline`,async({page,context})=>{
    await bootDetective(page,5,'medium');await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
    await enterDetective(page,game);
    if(!['matching','memory'].includes(game))await solveDetectiveStep(page);
    await context.setOffline(true);await page.reload({waitUntil:'commit'});
    await page.getByRole('button',{name:/מתחילים לשחק/}).click();await enterDetective(page,game);
    await finishDetective(page);await expect(page.getByTestId('discovery-summary')).toBeVisible();
    await context.setOffline(false);
  });
}
