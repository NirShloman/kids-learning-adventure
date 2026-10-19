// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGameFeedback } from '../../src/hooks/useGameFeedback';
const audio = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn(), sfx: vi.fn() }));
vi.mock('../../src/services/narrationService', () => ({ playNarrationText: audio.play, stopNarrationPlayback: audio.stop }));
vi.mock('../../src/services/audioService', () => ({ playSfx: audio.sfx }));
let root: Root;
let feedback: ReturnType<typeof useGameFeedback>;
let host: HTMLDivElement;
function Harness({voice}: {voice:boolean}) { feedback=useGameFeedback(voice);return <p>{feedback.message}</p>; }
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  Object.defineProperty(document,'hidden',{configurable:true,value:false});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(() => { act(()=>root.unmount());host.remove();vi.useRealTimers(); });
it('waits for both the visible minimum and this recording to end',()=>{
  act(()=>root.render(<Harness voice/>));const next=vi.fn();
  act(()=>{feedback.run('מצוין!',next,true);feedback.run('duplicate',next,true);});
  expect(audio.play).toHaveBeenCalledTimes(1);
  act(()=>vi.advanceTimersByTime(1600));expect(next).not.toHaveBeenCalled();
  act(()=>audio.play.mock.calls[0][1].onSettled('ended'));expect(next).toHaveBeenCalledTimes(1);
  act(()=>audio.play.mock.calls[0][1].onSettled('ended'));expect(next).toHaveBeenCalledTimes(1);
});
it('works without audio, including reduced motion, and expires stalled audio at ten seconds',()=>{
  act(()=>root.render(<Harness voice={false}/>));const next=vi.fn();
  act(()=>feedback.run('טוב',next));act(()=>vi.advanceTimersByTime(1499));expect(next).not.toHaveBeenCalled();
  act(()=>vi.advanceTimersByTime(1));expect(next).toHaveBeenCalledTimes(1);
  act(()=>root.render(<Harness voice/>));act(()=>feedback.run('טוב',next));
  act(()=>vi.advanceTimersByTime(9999));expect(next).toHaveBeenCalledTimes(1);
  act(()=>vi.advanceTimersByTime(1));expect(next).toHaveBeenCalledTimes(2);
});
it('does not advance in background or from stale callbacks and restarts feedback on return',()=>{
  act(()=>root.render(<Harness voice/>));const next=vi.fn();
  act(()=>feedback.run('מצוין',next));const stale=audio.play.mock.calls[0][1].onSettled;
  act(()=>window.dispatchEvent(new CustomEvent('lomdim:app-state',{detail:{isActive:false}})));
  act(()=>{stale('cancelled');vi.advanceTimersByTime(20000);});expect(next).not.toHaveBeenCalled();
  act(()=>window.dispatchEvent(new CustomEvent('lomdim:app-state',{detail:{isActive:true}})));
  act(()=>{stale('ended');vi.advanceTimersByTime(1500);});expect(next).not.toHaveBeenCalled();
  act(()=>audio.play.mock.calls[1][1].onSettled('ended'));expect(next).toHaveBeenCalledTimes(1);
});
it('cancels pending transitions on unmount',()=>{
  act(()=>root.render(<Harness voice={false}/>));const next=vi.fn();
  act(()=>feedback.run('מצוין',next));act(()=>root.render(null));
  act(()=>vi.advanceTimersByTime(20000));expect(next).not.toHaveBeenCalled();
});
