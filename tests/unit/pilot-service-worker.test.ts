// @vitest-environment node
import { describe,it,expect,vi } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
function worker(manifest:unknown) {
  const listeners:Record<string,(event:unknown)=>void>={}; const skipWaiting=vi.fn();const put=vi.fn();const postMessage=vi.fn();
  const context={ self:{location:{origin:'https://class.example'},addEventListener:(name:string,handler:(event:unknown)=>void)=>{listeners[name]=handler;},skipWaiting,clients:{claim:vi.fn()}},
    URL,caches:{open:async()=>({addAll:async()=>{},match:async()=>undefined,put}),keys:async()=>[],delete:async()=>true},fetch:vi.fn(async(url:string)=>url==='/pilot-offline.json'?{ok:true,json:async()=>manifest}:{ok:true,status:200,headers:{get:()=> 'audio/mpeg'}}),console };
  vm.runInNewContext(readFileSync('public/sw.js','utf8'),context);
  return{listeners,skipWaiting,put,postMessage,context};
}
describe('pilot offline worker',()=>{
  it('does not activate updates automatically during a game',async()=>{const w=worker([]);let pending:Promise<void>|undefined;w.listeners.install({waitUntil:(p:Promise<void>)=>{pending=p;}});await pending;expect(w.skipWaiting).not.toHaveBeenCalled();w.listeners.message({data:{type:'ACTIVATE_UPDATE'}});expect(w.skipWaiting).toHaveBeenCalledOnce();});
  it('accepts a full built manifest larger than a single-world preparation',async()=>{const w=worker(Array.from({length:2500},(_,i)=>`/assets/audio/narration/${i}.mp3`));let pending:Promise<void>|undefined;w.listeners.message({data:{type:'PREPARE_PILOT_OFFLINE'},ports:[{postMessage:w.postMessage}],waitUntil:(p:Promise<void>)=>{pending=p;}});await pending;expect(w.put).toHaveBeenCalledTimes(2500);expect(w.postMessage).toHaveBeenCalledWith(expect.objectContaining({ok:true}));});
  it('rejects external URLs before caching anything',async()=>{const w=worker(['/assets/safe.mp3','//external.example/track']);let pending:Promise<void>|undefined;w.listeners.message({data:{type:'PREPARE_PILOT_OFFLINE'},ports:[{postMessage:w.postMessage}],waitUntil:(p:Promise<void>)=>{pending=p;}});await pending;expect(w.put).not.toHaveBeenCalled();expect(w.postMessage).toHaveBeenCalledWith({ok:false});});
});
