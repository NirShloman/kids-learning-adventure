import { expect, Page } from '@playwright/test';
import { createDefaultProfile } from '../../src/services/learningStoreService';
import type { Age, Difficulty, GameId } from '../../src/types';
import { gameDefinitions } from '../../src/data/games';

export async function bootDetective(page:Page,age:Age=4,difficulty:Difficulty='medium',voice=false) {
  const profile=createDefaultProfile({id:'detective-test-profile',name:'נועה',gender:'girl',age,manualDifficulty:difficulty,narrationEnabled:voice,musicEnabled:false,soundEffectsEnabled:false});
  const snapshot={schemaVersion:4,migrationState:'complete',activeProfileId:profile.id,profiles:[profile],dataByProfile:{[profile.id]:{mastery:{},events:[],sessions:[],recentContent:{},activePlan:null,journey:{unlockedWorlds:['letters'],completedLevelIds:[],decorationIds:[]},lastEffectiveNow:profile.createdAt,dailyContentCounts:{}}},updatedAt:profile.createdAt};
  // Seed once; subsequent reloads must retain actual checkpoints.
  await page.addInitScript(snapshot=>{if(!sessionStorage.getItem('detective-test-seeded')){localStorage.clear();localStorage.setItem('lomdim-bekef.learning.v4',JSON.stringify(snapshot));sessionStorage.setItem('detective-test-seeded','true');}},snapshot);
  await page.goto('/',{waitUntil:'commit'});await page.getByRole('button',{name:/מתחילים לשחק/}).click();
  await expect(page.locator('.home-grid')).toBeVisible();
}
export async function enterDetective(page:Page,game:GameId) {
  const title=gameDefinitions.find(g=>g.id===game)!.title;
  await page.locator('.game-card').filter({has:page.getByRole('heading',{name:title,exact:true})}).getByRole('button',{name:'מתחילים',exact:true}).click();
  if(['letters','numbers','shapes','colors'].includes(game))await page.locator('.game-mode-card:not(.game-mode-card--featured)').click();
  await expect(page.locator('[data-testid="detective-session"]')).toBeVisible();
  await expect(page.locator('.detective-card')).toBeVisible();
}
export async function solveDetectiveStep(page:Page) {
  await expect(page.locator('.detective-answer,.detective-pair-card').first()).toBeVisible();
  const previousStep=await page.locator('.detective-chip').textContent();
  const choice=page.locator('.detective-answer[data-correct="true"]');
  if(await choice.count()) {if(await choice.isEnabled())await choice.click();}
  else {
    const peek=page.getByRole('button',{name:'מסתירים ומנסים'});if(await peek.isVisible())await peek.click();
    for(let i=0;i<10;i++) {
      const next=page.getByRole('button',{name:'ממשיכים לחפש',exact:true});if(await next.isVisible())await next.click();
      const cards=page.locator('.detective-pair-card:not(.is-matched)');if(!await cards.count())break;
      const first=cards.first(),id=await first.getAttribute('data-pair-id');
      const pair=page.locator(`.detective-pair-card[data-pair-id="${id}"]`);
      if(await pair.nth(0).getAttribute('aria-pressed')!=='true')await pair.nth(0).click();
      if(await pair.nth(1).getAttribute('aria-pressed')!=='true')await pair.nth(1).click();
    }
  }
  await page.getByRole('button',{name:/^(לשאלה הבאה|לתגלית הבאה|מגלים את התמונה)$/}).click();
  await expect.poll(async()=>await page.locator('.summary-card').isVisible() || await page.locator('.detective-chip').textContent()!==previousStep).toBe(true);
}
export async function finishDetective(page:Page) {
  for(let i=0;i<16;i++) {if(await page.locator('.summary-card').isVisible().catch(()=>false))return;await solveDetectiveStep(page);}
  await expect(page.locator('.summary-card')).toBeVisible();
}
