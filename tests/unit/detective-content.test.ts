// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateContent, semanticSignature, versionForContent } from '../../scripts/generate-static-content.mjs';
import { validateSemantics } from '../../scripts/validate-detective-semantics.mjs';
import { createProfile, getActiveProfile, saveDetectiveRound } from '../../src/services/learningStoreService';
import { getRecentContent } from '../../src/services/learnerProgressService';
import { newRound } from '../../src/components/games/detective/detectiveEngine';
import { sounds } from '../../scripts/content-facts.mjs';
import { clearStaticContentCache } from '../../src/services/staticContentRepository';
import { getQuizQuestions, getPatternPuzzles, getSortingChallenges, getMatchingPairs, getMemoryCards, pairCount } from '../../src/services/questionService';

const games=['letters','numbers','shapes','colors','patterns','sorting','matching','memory'] as const;
const banks=Object.fromEntries(games.map(game=>[game,JSON.parse(readFileSync(`src/content/${game}.json`,'utf8')).items]));
beforeEach(()=>{localStorage.clear();clearStaticContentCache();createProfile({age:4});});
describe('detective content semantics',()=>{
  it('changes the checkpoint version when authored content changes',()=>{
    const original=generateContent(),version=versionForContent(original);
    expect(JSON.parse(readFileSync('src/content/letters.json','utf8')).contentVersion).toBe(version);
    original.letters[0].hint+=' הביטו שוב.';
    expect(versionForContent(original)).not.toBe(version);
  });
  it('keeps reviewed initial vowels consistent, including the corrected minimal pairs',()=>{
    const pronunciation: Record<string,string> = {דג:'דָ',דלת:'דָ',חתול:'חָ',חלון:'חָ',כדור:'כַּ',כפית:'כַּ',מתנה:'מַ',מפתח:'מַ',סירה:'סִ',סיפור:'סִ',פרפר:'פַּ',פרה:'פַּ',ציפור:'צִ',ציפורן:'צִ',קופסה:'קוּ',קובייה:'קוּ',רכבת:'רַ',רדיו:'רַ',שעון:'שָׁ',שלום:'שָׁ',תפוח:'תַּ',תפוז:'תַּ',בננה:'בַּ',בלון:'בַּ'};
    for(const [,syllable,...words] of sounds) for(const [word] of words) expect(pronunciation[word],word).toBe(syllable);
  });
  it('resumes the same quiz without consuming a new selection or allowing immediate repeats',async()=>{
    const selected=await getQuizQuestions('letters',4,'medium');
    const recent=getRecentContent('letters:4:medium');
    const version=JSON.parse(readFileSync('src/content/letters.json','utf8')).contentVersion;
    saveDetectiveRound(getActiveProfile()!.id,'letters',newRound(selected.map(item=>({gameId:'letters',ids:[item.id]})),version,4,'medium'));
    expect((await getQuizQuestions('letters',4,'medium')).map(item=>item.id)).toEqual(selected.map(item=>item.id));
    expect(getRecentContent('letters:4:medium')).toEqual(recent);
    const first=await getQuizQuestions('numbers',4,'medium'),second=await getQuizQuestions('numbers',4,'medium');
    expect(second.some(item=>first.some(previous=>previous.id===item.id))).toBe(false);
  });
  it('reproduces the exact bank and solves every authored item independently',()=>{
    const generated=generateContent();
    for(const game of games){expect(generated[game]).toEqual(banks[game]);for(const item of banks[game])expect(validateSemantics(item),item.id).toEqual([]);}
  });
  for(const game of games)for(const age of [3,4,5,6] as const)for(const difficulty of ['easy','medium','hard'] as const) {
    it(`${game}/${age}/${difficulty} has 40 distinct valid tasks and a complete playable selection`,async()=>{
      const cell=banks[game].filter((v:any)=>v.ages[0]===age&&v.difficulty===difficulty);
      expect(cell).toHaveLength(40);expect(new Set(cell.map(semanticSignature)).size).toBe(40);
      const selected=game==='matching'?await getMatchingPairs(age,difficulty):game==='memory'?await getMemoryCards(age,difficulty):game==='patterns'?await getPatternPuzzles(age,difficulty):game==='sorting'?await getSortingChallenges(age,difficulty):await getQuizQuestions(game,age,difficulty);
      const expected=game==='matching'?pairCount(age,difficulty):game==='memory'?pairCount(age,difficulty)*2:game==='patterns'?(age<=4?5:7):game==='sorting'?(age<=3?5:7):age<=3?8:10;
      expect(selected).toHaveLength(expected);
      for(const item of selected){expect(item.ages).toEqual([age]);expect(item.difficulty).toBe(difficulty);}
      if(game==='matching'||game==='memory')expect(new Set(selected.map(v=>v.taskFamily)).size).toBe(1);
    });
  }
  it('rejects incorrect answers even when IDs, metadata and choice counts are valid',()=>{
    for(const game of ['letters','numbers','shapes','colors','patterns','sorting'])for(const original of banks[game].slice(0,40)) {
      const item=structuredClone(original);item.correctOptionId=item.options.find((o:any)=>o.id!==item.correctOptionId).id;
      expect(validateSemantics(item).length,item.id).toBeGreaterThan(0);
    }
  });
  it('rejects inaccurate quantities, shapes, patterns, phonology and semantic pairs',()=>{
    const counting=structuredClone(banks.numbers.find((v:any)=>v.logic.rule==='count'));counting.scene.items[0].count++;
    const comparison=structuredClone(banks.numbers.find((v:any)=>v.logic.rule==='compare'));comparison.options[0].visualToken.count=20;
    const shape=structuredClone(banks.shapes.find((v:any)=>v.logic.rule==='shape'));shape.scene.items[0].value='star';
    const pattern=structuredClone(banks.patterns[0]);pattern.scene.items[1].label='משהו אחר';
    const word=structuredClone(banks.letters.find((v:any)=>v.logic.rule==='same-sound'));word.options[0].label=word.logic.operands[0];
    const pair=structuredClone(banks.memory.find((v:any)=>v.logic.rule==='number-quantity'));pair.rightVisual.count++;
    for(const item of [counting,comparison,shape,pattern,word,pair])expect(validateSemantics(item).length,item.id).toBeGreaterThan(0);
  });
  it('rejects valid-looking but mislabeled artwork and unrelated distractors',()=>{
    const next=structuredClone(banks.numbers.find((v:any)=>v.logic.rule==='next'));next.scene.items[0].value='99';next.scene.items[0].label='99';
    const color=structuredClone(banks.colors.find((v:any)=>v.logic.rule==='color'));color.options[0].visualToken.value='#ffffff';color.options[0].visualToken.label='אדום';
    const shape=structuredClone(banks.shapes.find((v:any)=>v.logic.rule==='shape'));shape.options[0].visualToken.value='circle';shape.options[0].visualToken.label='ריבוע';
    const picture=structuredClone(banks.letters.find((v:any)=>v.logic.rule==='same-sound'));picture.scene.items[0].value='🍌';
    const domain=structuredClone(banks.shapes.find((v:any)=>v.logic.rule==='shape'));const wrong=domain.options.find((v:any)=>v.id!==domain.correctOptionId);wrong.label='בננה';wrong.visualToken={kind:'emoji',value:'🍌',label:'בננה'};
    const pair=structuredClone(banks.matching.find((v:any)=>v.logic.rule==='letter-picture'));pair.rightVisual.value='♨️';
    for(const item of [next,color,shape,picture,domain,pair])expect(validateSemantics(item).length,item.id).toBeGreaterThan(0);
  });
});
