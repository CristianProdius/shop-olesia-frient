// Lightweight in-memory fixed-window rate limiter.
//
// NOTE: this is per-instance / best-effort only. The counters live in a
// module-level Map in this process's memory, so they are NOT shared across
// multiple server instances (or serverless invocations). A shared store
// (e.g. Redis) is required for correct multi-instance limiting — acceptable
// for now as a basic abuse guard on public POST routes.

type WindowEntry = { count: number; resetAt: number };

const buckets = new Map<string, WindowEntry>();

/**
 * Fixed-window rate limiter.
 *
 * @param key      Unique bucket key (e.g. route name + client IP).
 * @param limit    Max allowed requests within the window.
 * @param windowMs Window length in milliseconds.
 * @returns true if the request is allowed, false if the limit is exceeded.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now >= entry.resetAt) {
        // Start a fresh window.
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= limit) {
        return false;
    }

    entry.count += 1;
    return true;
}
