import { expect, Page } from '@playwright/test';
import { createDefaultProfile } from '../../src/services/learningStoreService';
import type { Age, Difficulty, GameId } from '../../src/types';
import { gameDefinitions } from '../../src/data/games';

export async function bootDetective(page:Page,age:Age=4,difficulty:Difficulty='medium',voice=false) {
  const profile=createDefaultProfile({id:'detective-test-profile',name:'נועה',gender:'girl',age,manualDifficulty:difficulty,narrationEnabled:voice,musicEnabled:false,soundEffectsEnabled:false});
  const snapshot={schemaVersion:4,migrationState:'complete',activeProfileId:profile.id,profiles:[profile],dataByProfile:{[profile.id]:{mastery:{},events:[],sessions:[],recentContent:{},activePlan:null,journey:{unlockedWorlds:['letters'],completedLevelIds:[],decorationIds:[]},lastEffectiveNow:profile.createdAt,dailyContentCounts:{}}},updatedAt:profile.createdAt};
  // Seed once; subsequent reloads must retain actual checkpoints.
  await page.addInitScript(snapshot=>{if(!sessionStorage.getItem('detective-test-seeded')){localStorage.clear();localStorage.setItem('lomdim-bekef.learning.v4',JSON.stringify(snapshot));sessionStorage.setItem('detective-test-seeded','true');}},snapshot);
  await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:/מתחילים לשחק/}).click({timeout:30000});
  await expect(page.locator('.home-grid')).toBeVisible();
}
export async function enterDetective(page:Page,game:GameId) {
  const title=gameDefinitions.find(g=>g.id===game)!.title;
  const card=page.locator('.game-card').filter({has:page.getByRole('heading',{name:title,exact:true})});
  if(!await card.count()) await page.getByRole('button',{name:'לעמוד הבא',exact:true}).click();
  await card.click();
  if(['letters','numbers','shapes','colors'].includes(game))await page.locator('.game-mode-card:not(.game-mode-card--featured)').click();
  await expect(page.locator('[data-testid="detective-session"]')).toBeVisible();
  await expect(page.locator('.detective-card')).toBeVisible();
}
export async function solveDetectiveStep(page:Page) {
  if(await page.locator('.summary-card').isVisible()) return;
  const previousStep=await page.locator('.detective-chip').textContent();
  const choice=page.locator('.detective-answer[data-correct="true"]');
  if(await choice.count()) {
    await expect(page.locator('[data-feedback]')).toHaveAttribute('data-feedback','false',{timeout:15000});
    if(await choice.count()) await choice.click();
  } else {
    for(let i=0;i<10;i++) {
      if(await page.evaluate(previous => Boolean(document.querySelector('.summary-card')) || document.querySelector('.detective-chip')?.textContent !== previous, previousStep)) return;
      const cards=page.locator('.detective-pair-card:not(.is-matched)');
      if(!await cards.count()) break;
      await expect(page.locator('[data-feedback]')).toHaveAttribute('data-feedback','false',{timeout:15000});
      const id=await cards.first().getAttribute('data-pair-id');
      const pair=page.locator(`.detective-pair-card[data-pair-id="${id}"]`);
      if(await pair.nth(0).getAttribute('aria-pressed')!=='true')await pair.nth(0).click();
      await pair.nth(1).click();
      await expect(pair.first()).toHaveClass(/is-matched/);
    }
  }
  await expect.poll(() => page.evaluate(previous => Boolean(document.querySelector('.summary-card')) || document.querySelector('.detective-chip')?.textContent !== previous, previousStep),{timeout:15000}).toBe(true);
}
export async function finishDetective(page:Page) {
  for(let i=0;i<16;i++) {if(await page.locator('.summary-card').isVisible().catch(()=>false))return;await solveDetectiveStep(page);}
  await expect(page.locator('.summary-card')).toBeVisible();
}
