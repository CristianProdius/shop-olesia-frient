import { getAssistantRuntimeConfig } from "./config";

export interface AssistantRateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  now?: () => number;
}

export interface AssistantRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface AssistantRateLimiter {
  check: (key: string) => AssistantRateLimitResult;
  reset: (key?: string) => void;
}

interface Bucket {
  count: number;
  resetAt: number;
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

export function createAssistantRateLimiter(
  options: AssistantRateLimitOptions = {},
): AssistantRateLimiter {
  const runtimeConfig = getAssistantRuntimeConfig();
  const windowMs = positiveInteger(
    options.windowMs,
    runtimeConfig.rateLimitWindowMs,
  );
  const maxRequests = positiveInteger(
    options.maxRequests,
    runtimeConfig.rateLimitMax,
  );
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): AssistantRateLimitResult {
      const timestamp = now();
      const existing = buckets.get(key);

      if (!existing || timestamp >= existing.resetAt) {
        const resetAt = timestamp + windowMs;
        buckets.set(key, { count: 1, resetAt });

        return {
          allowed: true,
          remaining: Math.max(0, maxRequests - 1),
          resetAt,
        };
      }

      if (existing.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: existing.resetAt,
        };
      }

      existing.count += 1;

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - existing.count),
        resetAt: existing.resetAt,
      };
    },
    reset(key?: string): void {
      if (key) {
        buckets.delete(key);
        return;
      }

      buckets.clear();
    },
  };
}

export const assistantRateLimiter = createAssistantRateLimiter();
