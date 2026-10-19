import { test, expect, type Page } from '@playwright/test';
import { bootDetective, enterDetective } from './detective-helpers';
import { readFileSync } from 'node:fs';
import type { QuizQuestion } from '../../src/types';
const letters = JSON.parse(readFileSync('src/content/letters.json', 'utf8')) as { items: QuizQuestion[] };
import { adventureMissions } from '../../src/content/adventureMissions';
import { openAdventureIntro } from './adventure-helpers';
import { openGame } from './helpers';

async function visibleControlsFit(page: Page) {
  await expect.poll(() => page.evaluate(() => ({
    overflow: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1,
    outside: [...document.querySelectorAll('button, select, input, summary')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width && r.height && getComputedStyle(el).visibility !== 'hidden' &&
        (r.x < -1 || r.y < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
    }).map(el => el.outerHTML.slice(0, 200)),
  }))).toEqual({overflow: false, outside: []});
}

for (const [width, height] of [[320,568], [568,320]]) for (const mode of ['turns', 'cooperation']) {
  test(`shared ${mode} retries and scores once at ${width}x${height}`, async ({page}) => {
    await page.setViewportSize({width,height}); await bootDetective(page);
    await page.getByRole('button',{name:'🤝 יחד'}).click(); await visibleControlsFit(page);
    await page.getByRole('button',{name: mode === 'turns' ? /שני ילדים בתורות/ : /הורה וילד/}).click();
    await visibleControlsFit(page); await page.getByRole('button',{name:'מתחילים יחד'}).click();
    const choices = page.locator('.shared-play__choices button');
    await expect(choices.first()).toBeVisible();
    for(let index=0; index<6; index++) {
      const prompt = await page.locator('.shared-play h1').textContent();
      const labels = await choices.allTextContents();
      const question = letters.items.find(q => q.prompt === prompt && q.options.every(o => labels.some(l => l.trim() === `${o.emoji ?? ''} ${o.label}`.trim())))!;
      expect(question).toBeTruthy();
      const correct = question.options.find(o => o.id === question.correctOptionId)!;
      const right = choices.filter({hasText: correct.label});
      if(index === 0) {
        const turn = await page.locator('.question-card__tag').textContent();
        const wrong = question.options.find(o => o.id !== question.correctOptionId)!;
        for(let retry=0; retry<3; retry++) {
          await choices.filter({hasText: wrong.label}).click();
          await expect(page.locator('.shared-feedback')).toContainText('ננסה שוב');
          await visibleControlsFit(page);
          await expect(choices.first()).toBeEnabled();
          await expect(page.locator('.shared-play h1')).toHaveText(prompt!);
          await expect(page.locator('.question-card__tag')).toHaveText(turn!);
          await expect(page.locator('.shared-play header')).toContainText('כוכבי קבוצה: 0');
        }
      }
      await right.evaluate((el: HTMLButtonElement) => { el.click(); el.click(); });
      await expect(page.locator('.shared-feedback')).toContainText('מצוין');
      await expect(choices.first()).toBeDisabled(); await visibleControlsFit(page);
      if(index < 5) await expect(choices.first()).toBeEnabled();
    }
    await expect(page.getByRole('heading',{name:'איזו עבודת צוות נהדרת!'})).toBeVisible();
    await expect(page.locator('.shared-play')).toContainText('6 כוכבי קבוצה'); await visibleControlsFit(page);
    const data = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!); return s.dataByProfile[s.activeProfileId]; });
    expect(data.events.slice(0,4).map((e: any) => [e.correct,e.attemptNumber])).toEqual([[false,1],[false,2],[false,3],[true,4]]);
    expect(data.sessions).toHaveLength(1);
  });
}

test('background cancels a pending transition and returning replays feedback once', async ({page}) => {
  await bootDetective(page); await enterDetective(page,'numbers');
  const chip = await page.locator('.detective-chip').textContent();
  await page.locator('.detective-answer[data-correct="true"]').click();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('lomdim:app-state',{detail:{isActive:false}})));
  await page.waitForTimeout(1800); await expect(page.locator('.detective-chip')).toHaveText(chip!);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('lomdim:app-state',{detail:{isActive:true}})));
  await expect(page.locator('.detective-chip')).toHaveText(chip!);
  await expect(page.locator('.detective-chip')).toContainText('2/');
  const events = await page.evaluate(() => {const s=JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);return s.dataByProfile[s.activeProfileId].events;});
  expect(events).toHaveLength(1);
});

for(const variant of ['reduced-motion','load-failure'] as const) test(`welcome usable with ${variant}`, async({page})=>{
  if(variant==='reduced-motion') await page.emulateMedia({reducedMotion:'reduce'});
  else await page.route('**/*.mp4', route=>route.abort());
  await page.goto('/');
  await expect(page.locator('.ambient-video__fallback')).toBeVisible();
  if(variant==='reduced-motion') await expect(page.locator('video')).not.toHaveAttribute('src', /.+/);
  await page.getByRole('button',{name:/מתחילים לשחק/}).click();
  await expect(page.locator('#learner-name')).toBeVisible();
});

for(const mission of adventureMissions.filter((m,i,all)=>all.findIndex(other=>other.activity===m.activity)===i)) {
  test(`all activity controls fit: ${mission.activity}`,async({page})=>{
    await page.setViewportSize({width:320,height:568});await openAdventureIntro(page,mission,6,'hard');
    await visibleControlsFit(page);await page.locator('.adventure-intro .adventure-primary').click();
    await visibleControlsFit(page);
    await page.setViewportSize({width:568,height:320});await visibleControlsFit(page);
  });
}

test('memory restores found pairs and every card position after leaving', async ({page}) => {
  await bootDetective(page,6,'hard'); await enterDetective(page,'memory');
  const cards=page.locator('.detective-pair-card');
  const positions=await cards.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-pair-id')));
  const pair=page.locator(`.detective-pair-card[data-pair-id="${positions[0]}"]`);
  await pair.first().click();await pair.last().click();
  await expect(pair.first()).toHaveClass(/is-matched/);
  await page.getByRole('button',{name:'חזרה לתפריט',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:/מתחילים לשחק/}).click();
  await enterDetective(page,'memory');
  expect(await cards.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-pair-id')))).toEqual(positions);
  await expect(page.locator('.detective-pair-card.is-matched')).toHaveCount(2);
  await expect(page.locator('[data-feedback]')).toHaveAttribute('data-feedback','false');
});

test('large collections paginate without hiding creations or scrolling',async({page})=>{
  await page.setViewportSize({width:320,height:568});await bootDetective(page);
  await page.evaluate(missions=>{
    const key='lomdim-bekef.learning.v4', s=JSON.parse(localStorage.getItem(key)!);
    const data=s.dataByProfile[s.activeProfileId];
    data.detectives={rounds:{},discoveries:['letters','numbers','shapes','colors','patterns','sorting','matching','memory','mixed'].map(scope=>({id:scope,scope,completedAt:new Date().toISOString(),independent:5,assisted:0,demonstrated:0}))};
    data.adventures={letters:{version:1,completed:missions.map(m=>m.id),recent:[],rewards:missions.map(m=>m.id),creations:missions.map(m=>({id:m.id,missionId:m.id,seed:137,completedAt:new Date().toISOString()}))}};
    localStorage.setItem(key,JSON.stringify(s));
  },adventureMissions.filter(m=>m.gameId==='letters'));
  await page.reload();await page.getByRole('button',{name:/מתחילים לשחק/}).click();
  await page.getByRole('button',{name:'🏆 האוסף שלי'}).click();
  for(const count of [4,4,1]) {
    await expect(page.locator('.detective-collection figure')).toHaveCount(count);await visibleControlsFit(page);
    if(count===4)await page.getByRole('button',{name:'לעמוד הבא',exact:true}).click();
  }
  await page.getByRole('button',{name:'🎲 משחקים'}).click();await openGame(page,'אותיות');
  await page.getByRole('button',{name:'האוסף שלי ✦'}).click();
  await expect(page.locator('.adventure-reward-grid button')).toHaveCount(4);await visibleControlsFit(page);
  await page.getByRole('button',{name:'לעמוד הבא',exact:true}).click();await visibleControlsFit(page);
  await page.setViewportSize({width:568,height:320});await visibleControlsFit(page);
});

test('enlarged text allows accessible scrolling instead of clipping the game',async({page})=>{
  await page.setViewportSize({width:320,height:568});await bootDetective(page,6,'hard');
  await page.addStyleTag({content:'html { font-size: 200% !important; }'});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight)).toBeGreaterThan(568);
  await enterDetective(page,'memory');
  await expect(page.getByTestId('memory-card')).toHaveCount(14);
  for(const card of await page.getByTestId('memory-card').all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeInViewport();
  }
  await page.getByRole('button',{name:'חזרה לתפריט',exact:true}).click();
  await page.getByRole('button',{name:'🤝 יחד'}).click();
  await page.getByRole('button',{name:/שני ילדים בתורות/}).click();
  await page.getByRole('button',{name:'מתחילים יחד'}).click();
  await expect(page.locator('.shared-play__choices button').first()).toBeVisible();
  for(const button of await page.locator('.shared-play__choices button').all()) {
    await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();
  }
});
