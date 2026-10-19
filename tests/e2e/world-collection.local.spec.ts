import { test, expect } from '@playwright/test';
import { bootDetective, enterDetective, finishDetective } from './detective-helpers';

for (const [width, height] of [[393,851], [1280,800], [320,568], [568,320]]) {
  test(`illustrated games and keepsakes fit ${width}x${height}`, async ({page}, info) => {
    await page.setViewportSize({width,height});
    await bootDetective(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('body')).toHaveCSS('font-family', /Heebo/);
    for (const img of await page.locator('.game-card__cover').all()) {
      await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    }
    await page.screenshot({path: info.outputPath('games.png')});
    await page.getByRole('button',{name:'🏆 האוסף שלי'}).click();
    await expect(page.locator('.collection-total strong')).toHaveText('0 / 24');
    await expect(page.locator('.world-keepsake')).toHaveCount(4);
    for (const img of await page.locator('.world-keepsake__art img').all()) {
      await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    }
    await page.screenshot({path:info.outputPath('collection.png')});
    await page.getByRole('button',{name:'הספרייה הקסומה, 0 מתוך 3 מזכרות'}).click();
    await expect(page.getByRole('heading',{name:'הספרייה הקסומה'})).toBeFocused();
    await expect(page.locator('.collection-milestones li')).toHaveCount(3);
    await page.screenshot({path:info.outputPath('detail.png')});
    const size = await page.evaluate(() => ({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));
    expect(size.scrollWidth).toBeLessThanOrEqual(size.width + 1);
    expect(size.scrollHeight).toBeLessThanOrEqual(size.height + 1);
    const play = page.getByRole('button',{name:'יוצאים להרפתקה ←'});
    await expect(play).toBeInViewport();
    const playBox = await play.boundingBox();
    const navBox = await page.locator('.child-nav').boundingBox();
    expect(playBox!.y + playBox!.height).toBeLessThanOrEqual(navBox!.y);
    await page.getByRole('button',{name:'→ לכל האוצרות'}).click();
    await expect(page.getByRole('button',{name:'הספרייה הקסומה, 0 מתוך 3 מזכרות'})).toBeFocused();
    await page.getByRole('button',{name:'לעמוד הבא',exact:true}).click();
    await expect(page.getByRole('button',{name:'אי החלומות, 0 מתוך 3 מזכרות'})).toBeVisible();
    await page.getByRole('button',{name:'אי החלומות, 0 מתוך 3 מזכרות'}).click();
    await play.click();
    await expect(page.getByTestId('detective-session')).toBeVisible();
  });
}

test('completed play awards a persistent keepsake', async ({page},info) => {
  await bootDetective(page);
  await enterDetective(page,'letters');
  await finishDetective(page);
  await expect(page.getByText('מזכרת חדשה באוסף: מפתח הסיפורים!')).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:/מתחילים לשחק/}).click();
  await page.getByRole('button',{name:'🏆 האוסף שלי'}).click();
  await expect(page.locator('.collection-total strong')).toHaveText('1 / 24');
  await page.getByRole('button',{name:'הספרייה הקסומה, 1 מתוך 3 מזכרות'}).click();
  await expect(page.getByText('באוסף שלי ✓')).toBeVisible();
  await page.screenshot({path:info.outputPath('earned-keepsake.png')});
});
