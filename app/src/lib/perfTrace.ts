/**
 * Dev-only performance tracing utility.
 * Uses performance.now() to measure operation durations.
 * Zero overhead in production — all calls are no-ops when DEV is false.
 */

const IS_DEV = import.meta.env.DEV;

const activeTraces = new Map<string, number>();

/**
 * Start a named performance trace.
 */
export function startTrace(name: string): void {
  if (!IS_DEV) return;
  activeTraces.set(name, performance.now());
}

/**
 * End a named performance trace and log the duration.
 * Returns the duration in ms (0 in production).
 */
export function endTrace(name: string): number {
  if (!IS_DEV) return 0;
  const start = activeTraces.get(name);
  if (start === undefined) {
    console.warn(`[PERF] No start trace found for "${name}"`);
    return 0;
  }
  const duration = performance.now() - start;
  activeTraces.delete(name);
  const color = duration > 1000 ? 'color: #e53e3e' : duration > 300 ? 'color: #dd6b20' : 'color: #38a169';
  console.log(`%c[PERF] ${name}: ${duration.toFixed(1)}ms`, color);
  return duration;
}

/**
 * Wrap an async function with automatic start/end tracing.
 * Returns the function's result.
 */
export async function traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!IS_DEV) return fn();
  startTrace(name);
  try {
    const result = await fn();
    endTrace(name);
    return result;
  } catch (err) {
    endTrace(name);
    throw err;
  }
}
