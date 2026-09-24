import {test, expect} from '@playwright/test';
import {bootDetective, finishDetective, solveDetectiveStep} from './detective-helpers';

for (const age of [3,4,5,6] as const) for (const difficulty of ['easy','medium','hard'] as const) {
  test(`adaptive age ${age} ${difficulty}: selected level, pair size and replay`, async ({page}) => {
    await bootDetective(page,age,difficulty);
    await page.getByRole('button',{name:'🌱 המסלול שלי'}).click(); await page.getByRole('button',{name:'מתחילים תרגול מותאם'}).click();
    await expect(page.getByTestId('adaptive-session')).toBeVisible();
    const readRound=()=>page.evaluate(()=>{
      const snapshot=JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);
      return snapshot.dataByProfile[snapshot.activeProfileId].detectives.rounds.mixed;
    });
    const round=await readRound();
    expect(round.age).toBe(age);expect(round.difficulty).toBe(difficulty);
    for (const step of round.steps) {
      expect(step.ids).toHaveLength(['matching','memory'].includes(step.gameId)?age<=4?2:3:1);
      for (const id of step.ids)expect(id).toContain(`-a${age}-${difficulty}-`);
    }
    for(let index=0;index<round.steps.length;index++) {
      await expect(page.getByTestId('adaptive-session')).toHaveAttribute('data-age',String(age));
      await expect(page.getByTestId('adaptive-session')).toHaveAttribute('data-difficulty',difficulty);
      if(!['matching','memory'].includes(round.steps[index].gameId))await expect(page.locator('.detective-stimulus')).toBeVisible();
      await solveDetectiveStep(page);
    }
    await expect(page.getByTestId('discovery-summary')).toBeVisible();
    await page.getByRole('button',{name:'לשחק שוב',exact:true}).click();
    await expect(page.getByTestId('adaptive-session')).toBeVisible();
    const replay=await readRound();expect(replay.id).not.toBe(round.id);
    expect(replay.age).toBe(age);expect(replay.difficulty).toBe(difficulty);
    await finishDetective(page);
    const discoveries=await page.evaluate(()=>{
      const snapshot=JSON.parse(localStorage.getItem('lomdim-bekef.learning.v4')!);
      return snapshot.dataByProfile[snapshot.activeProfileId].detectives.discoveries;
    });
    expect(discoveries).toHaveLength(2);
  });
}
