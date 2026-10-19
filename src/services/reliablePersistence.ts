export interface PersistenceStatus { pending: number; failed: boolean }
interface Mutation { run: () => void | Promise<unknown>; resolve: () => void; reject: (error: unknown) => void }

/** Failed writes remain ordered until an explicit retry; checkpoints are never discarded. */
export class ReliablePersistence {
  private queue: Mutation[] = [];
  private running = false;
  private failure: unknown;
  private listeners = new Set<() => void>();
  private status: PersistenceStatus = { pending: 0, failed: false };
  getStatus = (): PersistenceStatus => this.status;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private notify(): void {
    this.status = { pending: this.queue.length, failed: this.failure !== undefined };
    this.listeners.forEach(listener => listener());
  }
  enqueue(run: Mutation['run']): Promise<void> {
    const result = new Promise<void>((resolve, reject) => { this.queue.push({ run, resolve, reject }); });
    // Fire-and-forget callers get a visible status; awaiting still rejects.
    void result.catch(() => undefined);
    this.notify();
    this.drain();
    return result;
  }
  private drain(): void {
    if (this.running || this.failure !== undefined) return;
    while (this.queue.length) {
      const mutation = this.queue[0];
      this.running = true;
      try {
        const result = mutation.run();
        if (result && typeof result.then === 'function') {
          void result.then(() => { this.succeeded(mutation); this.drain(); }, error => this.failed(mutation, error));
          return;
        }
        this.succeeded(mutation);
      } catch (error) { this.failed(mutation, error); return; }
    }
  }
  private succeeded(mutation: Mutation): void {
    this.queue.shift();
    this.running = false;
    mutation.resolve();
    this.notify();
  }
  private failed(mutation: Mutation, error: unknown): void {
    this.running = false;
    this.failure = error ?? new Error('Storage unavailable');
    mutation.reject(this.failure);
    this.notify();
  }
  flush(): Promise<void> {
    if (this.failure !== undefined) return Promise.reject(this.failure);
    if (!this.queue.length) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribe(() => {
        if (this.failure !== undefined) { unsubscribe(); reject(this.failure); }
        else if (!this.queue.length) { unsubscribe(); resolve(); }
      });
    });
  }
  retry(): Promise<void> {
    this.failure = undefined;
    this.notify();
    this.drain();
    return this.flush();
  }
}
