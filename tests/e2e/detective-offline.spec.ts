import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective, finishDetective, solveDetectiveStep } from './detective-helpers';
for(const game of ['letters','numbers','shapes','colors','patterns','sorting','matching','memory','mixed'] as const) {
  test(`${game}: prepared production session resumes and finishes offline`,async({page,context})=>{
    const audioFailures:string[]=[];
    page.on('requestfailed',request=>{if(request.url().includes('/audio/narration/')&&request.failure()?.errorText!=='net::ERR_ABORTED')audioFailures.push(request.url());});
    await page.addInitScript(()=>{
      (window as any).__offlineAudio={errors:[] as string[],decoded:0};
      const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){
        if(this.src.includes('/audio/narration/')){
          this.addEventListener('error',()=>{(window as any).__offlineAudio.errors.push(this.src);},{once:true});
          this.addEventListener('playing',()=>{if(!this.paused&&this.readyState>=2)(window as any).__offlineAudio.decoded++;},{once:true});
        }
        return play.call(this);
      };
    });
    const enter=async()=>{
      if(game!=='mixed')return enterDetective(page,game);
      await page.getByRole('button',{name:'מתחילים תרגול מותאם'}).click();
      await expect(page.getByTestId('adaptive-session')).toBeVisible();
    };
    await bootDetective(page,5,'medium',true);await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
    await enter();
    await page.getByRole('button',{name:'שמירה למשחק ללא רשת',exact:true}).click();
    await expect(page.getByRole('button',{name:'המשחק מוכן גם ללא רשת',exact:true})).toBeVisible({timeout:120_000});
    if(!['matching','memory'].includes(game))await solveDetectiveStep(page);
    await context.setOffline(true);await page.reload({waitUntil:'commit'});
    await page.getByRole('button',{name:/מתחילים לשחק/}).click();await enter();
    await finishDetective(page);await expect(page.getByTestId('discovery-summary')).toBeVisible();
    expect(audioFailures).toEqual([]);
    await expect.poll(()=>page.evaluate(()=>(window as any).__offlineAudio.decoded)).toBeGreaterThan(0);
    expect(await page.evaluate(()=>(window as any).__offlineAudio.errors)).toEqual([]);
    await context.setOffline(false);
  });
}
