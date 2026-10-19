import { test, expect } from '@playwright/test';

test('welcome characters remain contained throughout the film', async ({page}, info) => {
  await page.setViewportSize({width:320,height:568});await page.goto('/');
  const video=page.locator('video');
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>Number.isFinite(v.duration) && v.readyState>=2)).toBe(true);
  for(const fraction of [0.1,0.5,0.9]) {
    await video.evaluate(async(v:HTMLVideoElement,fraction)=>{
      v.pause(); const seeked=new Promise<void>(resolve=>v.addEventListener('seeked',()=>resolve(),{once:true}));
      v.currentTime=v.duration*fraction;await seeked;
    },fraction);
    await expect(video).toHaveCSS('object-fit','contain');
    await expect(page.getByRole('button',{name:/מתחילים לשחק/})).toBeInViewport();
    await page.screenshot({path:info.outputPath(`welcome-${fraction*100}.png`)});
  }
});
