import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective, finishDetective } from './detective-helpers';
import { adventureMissions } from '../../src/content/adventureMissions';
import { openAdventureIntro, solveMission } from './adventure-helpers';

async function fits(page: import('@playwright/test').Page) {
  // React can reveal a suspended scene before WebKit has recalculated its
  // ancestor's immersive class. Check the settled layout, not that intermediate frame.
  if (await page.locator('.app-shell--adventure').count()) {
    await expect(page.locator('.app-shell--adventure')).toHaveCSS('padding', '0px');
  }
  const metrics = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollHeight, horizontal: document.documentElement.scrollWidth, shell: document.querySelector('.app-shell')?.className, padding: document.querySelector('.app-shell') ? getComputedStyle(document.querySelector('.app-shell')!).padding : '', stage: document.querySelector('.adventure')?.getBoundingClientRect().toJSON() }));
  expect(metrics.horizontal, 'horizontal overflow').toBeLessThanOrEqual(metrics.width + 1);
  expect(metrics.scroll, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.height + 1);
  for (const target of await page.locator('button:visible').all()) {
    const box = await target.boundingBox();
    if (!box) continue;
    expect(box.y + box.height, await target.getAttribute('class') ?? '').toBeLessThanOrEqual(metrics.height + 1);
    expect(box.width, await target.textContent() ?? '').toBeGreaterThanOrEqual(55.9);
    expect(box.height, await target.textContent() ?? '').toBeGreaterThanOrEqual(55.9);
  }
}

test('memory mismatch recovers, blocks rapid extra flips and finishes without scrolling', async ({page},info) => {
  await page.setViewportSize({width:320,height:568});
  await bootDetective(page,6,'hard');await enterDetective(page,'memory');
  const cards=page.getByTestId('memory-card');
  const id=await cards.first().getAttribute('data-pair-id');
  await cards.first().click();
  const wrong=page.locator(`.detective-pair-card:not([data-pair-id="${id}"])`).first();
  await wrong.click();
  await expect(cards.locator('..').first()).toBeVisible();
  await expect(page.locator('.detective-pair-card[aria-pressed="true"]')).toHaveCount(2);
  await cards.last().evaluate((button:HTMLButtonElement)=>button.click());
  await expect(page.locator('.detective-pair-card[aria-pressed="true"]')).toHaveCount(2);
  await expect(page.locator('.detective-pair-card[aria-pressed="true"]')).toHaveCount(0);
  await fits(page);
  await finishDetective(page);await fits(page);
  await page.screenshot({path:info.outputPath('summary.png')});
});

for(const [width,height] of [[320,568],[568,320],[768,1024]]) {
  test(`welcome video preserves frame and setup fits ${width}x${height}`,async({page},info)=>{
    await page.setViewportSize({width,height});await page.goto('/');
    const video=page.locator('video');await expect(video).toHaveCSS('object-fit','contain');
    await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(2);
    await video.evaluate(async (v:HTMLVideoElement)=>{v.pause();v.currentTime=v.duration/2;await new Promise<void>(resolve=>v.addEventListener('seeked',()=>resolve(),{once:true}));});
    await fits(page);await page.screenshot({path:info.outputPath('welcome.png')});
    await page.getByRole('button',{name:/מתחילים לשחק/}).click();await fits(page);
    await page.getByRole('button',{name:'ממשיכים',exact:true}).click();await fits(page);
    await page.getByRole('button',{name:'ממשיכים',exact:true}).click();await fits(page);
  });
}

for(const gameId of ['letters','numbers','shapes','colors'] as const) {
  test(`adventure feedback and layout ${gameId}`,async({page},info)=>{
    await page.setViewportSize({width:320,height:568});
    const mission=adventureMissions.find(m=>m.gameId===gameId)!;
    await openAdventureIntro(page,mission);
    await expect(page.locator('.adventure-intro')).toBeVisible();
    await fits(page);await page.screenshot({path:info.outputPath('intro.png')});
    await page.locator('.adventure-intro .adventure-primary').click();await fits(page);
    await solveMission(page,mission);await fits(page);
    await expect(page.locator('.adventure-intro')).toBeVisible();
  });
}
for (const [width,height] of [[320,568],[568,320],[393,851],[851,393],[768,1024],[1024,768],[1280,800]]) {
  test(`child screens fit ${width}x${height}`, async ({page}, info) => {
    await page.setViewportSize({width,height});
    await bootDetective(page,6,'hard');
    await fits(page);
    await page.screenshot({path:info.outputPath('home.png')});
    await page.getByRole('button',{name:'🌱 המסלול שלי'}).click(); await fits(page);
    await page.getByRole('button',{name:'🎲 משחקים'}).click();
    for (const game of ['memory','matching','numbers','patterns','sorting','colors','letters','shapes'] as const) {
      await enterDetective(page,game);
      await fits(page);
      if(game==='memory') await page.screenshot({path:info.outputPath('memory.png')});
      await page.getByRole('button',{name:'חזרה לתפריט',exact:true}).click();
    }
  });
}
