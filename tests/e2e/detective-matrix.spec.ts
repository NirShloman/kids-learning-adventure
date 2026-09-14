import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective, finishDetective } from './detective-helpers';

for(const game of ['letters','numbers','shapes','colors','patterns','sorting','matching','memory'] as const)
for(const age of [3,4,5,6] as const)
for(const difficulty of ['easy','medium','hard'] as const) {
  test(`${game} age ${age} ${difficulty}: complete age-correct session`,async({page},testInfo)=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await bootDetective(page,age,difficulty);await enterDetective(page,game);
    await expect(page.getByTestId('detective-session')).toHaveAttribute('data-age',String(age));
    await expect(page.getByTestId('detective-session')).toHaveAttribute('data-difficulty',difficulty);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const targets=page.locator('.detective-answer,.detective-pair-card');
    for(const target of await targets.all()){const box=await target.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(55.9);expect(box!.height).toBeGreaterThanOrEqual(55.9);}
    const wrong=page.locator('.detective-answer[data-correct="false"]');
    if(await wrong.count()){await wrong.first().click();await expect(page.locator('.detective-feedback--hint')).toBeVisible();}
    if(age===6&&difficulty==='hard')await page.screenshot({path:testInfo.outputPath(`${game}-board.png`),fullPage:true});
    await finishDetective(page);await expect(page.getByTestId('discovery-summary')).toBeVisible();
    const result=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);const d=s.dataByProfile[s.activeProfileId];return {last:d.detectives.last,events:d.events};});
    expect(result.last.independent+result.last.assisted+result.last.demonstrated).toBeGreaterThan(0);
    expect(new Set(result.events.map((e:any)=>`${e.sessionId}:${e.contentId}:${e.attemptNumber}`)).size).toBe(result.events.length);
    expect(result.events.every((e:any)=>e.contentId.includes(`-a${age}-${difficulty}-`))).toBe(true);
    expect(errors).toEqual([]);
  });
}
