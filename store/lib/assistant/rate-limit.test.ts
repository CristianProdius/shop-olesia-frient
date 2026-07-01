import { describe, expect, it } from "vitest";

import { createAssistantRateLimiter } from "./rate-limit";

describe("createAssistantRateLimiter", () => {
  it("allows requests until the configured max and blocks the next one", () => {
    let now = 1_000;
    const limiter = createAssistantRateLimiter({
      windowMs: 10_000,
      maxRequests: 2,
      now: () => now,
    });

    expect(limiter.check("client-a")).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 11_000,
    });
    expect(limiter.check("client-a")).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 11_000,
    });
    expect(limiter.check("client-a")).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: 11_000,
    });
  });

  it("allows requests again after the window resets", () => {
    let now = 1_000;
    const limiter = createAssistantRateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
      now: () => now,
    });

    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-a").allowed).toBe(false);

    now = 11_000;

    expect(limiter.check("client-a")).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 21_000,
    });
  });

  it("tracks keys independently", () => {
    const limiter = createAssistantRateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
      now: () => 1_000,
    });

    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-a").allowed).toBe(false);
    expect(limiter.check("client-b")).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 11_000,
    });
  });

  it("can reset one key or all keys manually", () => {
    const limiter = createAssistantRateLimiter({
      windowMs: 10_000,
      maxRequests: 1,
      now: () => 1_000,
    });

    limiter.check("client-a");
    limiter.check("client-b");
    expect(limiter.check("client-a").allowed).toBe(false);
    expect(limiter.check("client-b").allowed).toBe(false);

    limiter.reset("client-a");
    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-b").allowed).toBe(false);

    limiter.reset();
    expect(limiter.check("client-b").allowed).toBe(true);
  });
});
