import { describe, expect, it, vi } from 'vitest';
import { ReliablePersistence } from '../../src/services/reliablePersistence';

describe('durable persistence queue', () => {
  it('keeps a failed checkpoint ahead of newer writes and replays it on retry', async () => {
    const queue = new ReliablePersistence();
    const writes: string[] = [];
    let available = false;
    const first = queue.enqueue(async () => {
      if (!available) throw new Error('disk full');
      writes.push('checkpoint');
    });
    const second = queue.enqueue(async () => { writes.push('next checkpoint'); });
    await expect(first).rejects.toThrow('disk full');
    expect(queue.getStatus()).toEqual({ pending: 2, failed: true });
    expect(writes).toEqual([]);
    await expect(queue.flush()).rejects.toThrow('disk full');
    available = true;
    await queue.retry();
    await second;
    expect(writes).toEqual(['checkpoint', 'next checkpoint']);
    expect(queue.getStatus()).toEqual({ pending: 0, failed: false });
  });

  it('does not claim durable success while a native write is still running', async () => {
    const queue = new ReliablePersistence();
    let complete!: () => void;
    const write = queue.enqueue(() => new Promise<void>(resolve => { complete = resolve; }));
    const flushed = vi.fn();
    const flush = queue.flush().then(flushed);
    expect(queue.getStatus().pending).toBe(1);
    await Promise.resolve();
    expect(flushed).not.toHaveBeenCalled();
    complete();
    await write;
    await flush;
    expect(flushed).toHaveBeenCalledOnce();
  });

  it('does not erase progress if a later deletion fails', async () => {
    const queue = new ReliablePersistence();
    let disk = 'saved progress';
    let allowDelete = false;
    const deletion = queue.enqueue(() => {
      if (!allowDelete) throw new Error('permission denied');
      disk = '';
    });
    await expect(deletion).rejects.toThrow('permission denied');
    expect(disk).toBe('saved progress');
    allowDelete = true;
    await queue.retry();
    expect(disk).toBe('');
  });
});
