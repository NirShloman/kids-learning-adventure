import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective, finishDetective, solveDetectiveStep } from './detective-helpers';

test('detective smoke: hint, explicit progression, checkpoint and collection',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await bootDetective(page,4,'medium');await enterDetective(page,'numbers');
  await expect(page.locator('.detective-game')).toHaveAttribute('data-age','4');
  await expect(page.locator('.detective-game')).toHaveAttribute('data-difficulty','medium');
  await page.getByRole('button',{name:'💡 רמז',exact:true}).click();
  await expect(page.locator('.detective-feedback--hint')).toBeVisible();
  await page.locator('.detective-answer[data-correct="true"]').click();
  await expect(page.locator('.detective-feedback')).toContainText('הרמז עזר');
  const heading=await page.locator('.detective-card h2').textContent();
  await page.waitForTimeout(1100);await expect(page.locator('.detective-card h2')).toHaveText(heading!);
  await page.screenshot({path:testInfo.outputPath('detective-feedback.png'),fullPage:true});
  await solveDetectiveStep(page);
  const checkpoint=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);return s.dataByProfile[s.activeProfileId].detectives.rounds.numbers;});
  await page.getByRole('button',{name:'חזרה לתפריט',exact:true}).click();await enterDetective(page,'numbers');
  await expect(page.locator('.detective-chip')).toContainText('2/');
  const restored=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);return s.dataByProfile[s.activeProfileId].detectives.rounds.numbers;});
  expect(restored.id).toBe(checkpoint.id);
  await finishDetective(page);await expect(page.getByTestId('discovery-summary')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('detective-summary.png'),fullPage:true});
  await page.getByRole('button',{name:'לתפריט המשחקים',exact:true}).click();
  await expect(page.locator('.detective-collection')).toBeVisible();expect(errors).toEqual([]);
});

test('adaptive uses the same visible activities and finishes a mixed discovery',async({page})=>{
  await bootDetective(page,5,'hard');await page.getByRole('button',{name:'מתחילים תרגול מותאם'}).click();
  await expect(page.getByTestId('adaptive-session')).toBeVisible();
  await finishDetective(page);await expect(page.getByTestId('discovery-summary')).toBeVisible();
});

for(const game of ['matching','memory'] as const)test(`${game} supports a controlled hint and a complete board`,async({page})=>{
  await bootDetective(page,6,'hard');await enterDetective(page,game);
  await page.getByRole('button',{name:'💡 רמז',exact:true}).click();
  await expect(page.locator('.detective-pair-card.is-hint')).toHaveCount(2);
  await page.getByRole('button',{name:'מסתירים ומנסים'}).click();
  await finishDetective(page);await expect(page.getByTestId('discovery-summary')).toBeVisible();
});
