export function startMeasure(label: string): () => number {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return () => {
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = end - start;
    if (import.meta.env.DEV) {
      console.debug(`[perf] ${label}: ${Math.round(duration)}ms`);
    }
    return duration;
  };
}

export async function measureAsync<T>(label: string, task: () => Promise<T>): Promise<T> {
  const end = startMeasure(label);
  try {
    return await task();
  } finally {
    end();
  }
}
