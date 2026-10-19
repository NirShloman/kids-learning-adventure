// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import letters from '../../src/content/letters.json';
import type { DetectiveItem } from '../../src/types/detective.types';
import { answerChoice, answerPair, canResume, newRound, useHint, orderBySeed, resumeRound } from '../../src/components/games/detective/detectiveEngine';
import { createProfile, getProfileData, saveDetectiveRound, finishDetectiveRound, getDetectiveProgress, deleteProfile } from '../../src/services/learningStoreService';
const item=letters.items.find(v=>v.ages[0]===4&&v.difficulty==='medium') as DetectiveItem;
const correct=item.correctOptionId!,wrong=item.options!.filter(v=>v.id!==correct);
const round=()=>newRound([{gameId:'letters',ids:[item.id]}],letters.contentVersion,4,'medium');
beforeEach(()=>localStorage.clear());
describe('detective state and local evidence',()=>{
  it('restores a shuffled board without clustering the original neighboring pairs',()=>{
    const cards=Array.from({length:14},(_,i)=>i), boards=Array.from({length:100},(_,i)=>orderBySeed(cards,`round-${i}`));
    expect(orderBySeed(cards,'round-12')).toEqual(boards[12]);
    expect(new Set(boards.map(board=>board.join(','))).size).toBe(100);
    for(const board of boards)expect([...board].sort((a,b)=>a-b)).toEqual(cards);
    const adjacent=boards.reduce((sum,board)=>sum+board.filter((card,i)=>i>0&&Math.floor(card/2)===Math.floor(board[i-1]/2)).length,0);
    expect(adjacent/boards.length).toBeLessThan(2);
    expect(cards).toEqual(Array.from({length:14},(_,i)=>i));
  });
  it('allows repeated mistakes until the child solves the question',()=>{
    const first=answerChoice(round(),item,wrong[0].id);
    expect(first.attempts[item.id]).toBe(1);expect(first.outcomes[item.id]).toBeUndefined();expect(first.hinted).toContain(item.id);
    const repeated=answerChoice(first,item,wrong[0].id);
    expect(repeated.attempts[item.id]).toBe(2);
    expect(repeated.outcomes[item.id]).toBeUndefined();
    const second=answerChoice(repeated,item,wrong[1].id);expect(second.outcomes[item.id]).toBeUndefined();
    expect(answerChoice(second,item,correct).outcomes[item.id]).toBe('assisted');
  });
  it('reopens legacy demonstrations while retaining genuine answers and attempts',()=>{
    const old={...round(),steps:[{gameId:'letters' as const,ids:[item.id]},{gameId:'letters' as const,ids:['next']}],index:1,outcomes:{[item.id]:'demonstrated' as const,next:'independent' as const},attempts:{[item.id]:2}};
    const restored=resumeRound(old);
    expect(restored.index).toBe(0);expect(restored.outcomes).toEqual({next:'independent'});
    expect(restored.attempts).toEqual(old.attempts);expect(old.outcomes[item.id]).toBe('demonstrated');
  });
  it('distinguishes independent, hinted, retry and pair outcomes',()=>{
    expect(answerChoice(round(),item,correct).outcomes[item.id]).toBe('independent');
    expect(answerChoice(useHint(round(),item.id),item,correct).outcomes[item.id]).toBe('assisted');
    expect(answerChoice(answerChoice(round(),item,wrong[0].id),item,correct).outcomes[item.id]).toBe('assisted');
    expect(answerPair(answerPair(round(),item.id,false),item.id,true).outcomes[item.id]).toBe('assisted');
  });
  it('rejects unknown answers and checkpoints incompatible with version or settings',()=>{
    const r=round();expect(answerChoice(r,item,'invented')).toBe(r);
    expect(canResume(r,letters.contentVersion,4,'medium',[item])).toBe(true);
    expect(canResume(r,'next-content',4,'medium',[item])).toBe(false);
    expect(canResume(r,letters.contentVersion,3,'medium',[item])).toBe(false);
    expect(canResume(r,letters.contentVersion,4,'hard',[item])).toBe(false);
    expect(canResume(r,letters.contentVersion,4,'medium',[])).toBe(false);
    expect(canResume({...r,steps:undefined} as any,letters.contentVersion,4,'medium',[item])).toBe(false);
    expect(canResume({...r,outcomes:{invented:'independent'}},letters.contentVersion,4,'medium',[item])).toBe(false);
  });
  it('atomically saves evidence and checkpoint, deduplicates retries and isolates children',()=>{
    const profile=createProfile({age:4}),other=createProfile({age:4});
    const r=answerChoice(round(),item,correct);
    const event={profileId:profile.id,sessionId:r.id,contentId:item.id,gameId:'letters' as const,skillIds:item.skillIds!,evidenceForm:item.evidenceForm!,correct:true,attemptNumber:1,hintUsed:false,responseMs:400,monotonicMs:500};
    saveDetectiveRound(profile.id,'letters',r,event);saveDetectiveRound(profile.id,'letters',r,event);
    expect(getProfileData(profile.id).events).toHaveLength(1);expect(getDetectiveProgress(profile.id).rounds.letters).toEqual(r);
    expect(getDetectiveProgress(other.id).rounds.letters).toBeUndefined();
    finishDetectiveRound(profile.id,'letters',r);finishDetectiveRound(profile.id,'letters',r);
    expect(getDetectiveProgress(profile.id).discoveries).toHaveLength(1);expect(getDetectiveProgress(profile.id).rounds.letters).toBeUndefined();
    deleteProfile(profile.id);expect(getDetectiveProgress(profile.id).discoveries).toHaveLength(0);
  });
});
