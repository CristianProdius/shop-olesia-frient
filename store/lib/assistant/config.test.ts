import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ASSISTANT_DEFAULT_MAX_HISTORY,
  ASSISTANT_DEFAULT_MAX_KNOWLEDGE,
  ASSISTANT_DEFAULT_MAX_ORDERS,
  ASSISTANT_DEFAULT_MAX_PRODUCTS,
  ASSISTANT_DEFAULT_RATE_LIMIT_MAX,
  ASSISTANT_DEFAULT_RATE_LIMIT_WINDOW_MS,
  getAssistantRuntimeConfig,
} from "./config";

const originalEnv = { ...process.env };

describe("getAssistantRuntimeConfig", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("returns safe defaults when assistant env vars are absent", () => {
    delete process.env.ASSISTANT_MAX_HISTORY;
    delete process.env.ASSISTANT_MAX_PRODUCTS;
    delete process.env.ASSISTANT_MAX_KNOWLEDGE;
    delete process.env.ASSISTANT_MAX_ORDERS;
    delete process.env.ASSISTANT_RATE_LIMIT_WINDOW_MS;
    delete process.env.ASSISTANT_RATE_LIMIT_MAX;

    expect(getAssistantRuntimeConfig()).toEqual({
      maxHistory: ASSISTANT_DEFAULT_MAX_HISTORY,
      maxProducts: ASSISTANT_DEFAULT_MAX_PRODUCTS,
      maxKnowledge: ASSISTANT_DEFAULT_MAX_KNOWLEDGE,
      maxOrders: ASSISTANT_DEFAULT_MAX_ORDERS,
      rateLimitWindowMs: ASSISTANT_DEFAULT_RATE_LIMIT_WINDOW_MS,
      rateLimitMax: ASSISTANT_DEFAULT_RATE_LIMIT_MAX,
    });
  });

  it("uses positive integer env overrides", () => {
    process.env.ASSISTANT_MAX_HISTORY = "4";
    process.env.ASSISTANT_MAX_PRODUCTS = "7";
    process.env.ASSISTANT_MAX_KNOWLEDGE = "9";
    process.env.ASSISTANT_MAX_ORDERS = "2";
    process.env.ASSISTANT_RATE_LIMIT_WINDOW_MS = "30000";
    process.env.ASSISTANT_RATE_LIMIT_MAX = "20";

    expect(getAssistantRuntimeConfig()).toEqual({
      maxHistory: 4,
      maxProducts: 7,
      maxKnowledge: 9,
      maxOrders: 2,
      rateLimitWindowMs: 30000,
      rateLimitMax: 20,
    });
  });

  it("falls back for zero, negative, fractional, empty, and non-numeric values", () => {
    process.env.ASSISTANT_MAX_HISTORY = "0";
    process.env.ASSISTANT_MAX_PRODUCTS = "-1";
    process.env.ASSISTANT_MAX_KNOWLEDGE = "1.5";
    process.env.ASSISTANT_MAX_ORDERS = "";
    process.env.ASSISTANT_RATE_LIMIT_WINDOW_MS = "abc";
    process.env.ASSISTANT_RATE_LIMIT_MAX = " ";

    expect(getAssistantRuntimeConfig()).toEqual({
      maxHistory: ASSISTANT_DEFAULT_MAX_HISTORY,
      maxProducts: ASSISTANT_DEFAULT_MAX_PRODUCTS,
      maxKnowledge: ASSISTANT_DEFAULT_MAX_KNOWLEDGE,
      maxOrders: ASSISTANT_DEFAULT_MAX_ORDERS,
      rateLimitWindowMs: ASSISTANT_DEFAULT_RATE_LIMIT_WINDOW_MS,
      rateLimitMax: ASSISTANT_DEFAULT_RATE_LIMIT_MAX,
    });
  });
});

describe("assistant model config", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("uses the current dated Haiku model by default", async () => {
    delete process.env.ANTHROPIC_MODEL;
    vi.resetModules();

    const config = await import("./config");

    expect(config.ASSISTANT_MODEL).toBe("claude-haiku-4-5-20251001");
  });

  it("uses an explicit Anthropic model override", async () => {
    process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
    vi.resetModules();

    const config = await import("./config");

    expect(config.ASSISTANT_MODEL).toBe("claude-sonnet-5");
  });
});
