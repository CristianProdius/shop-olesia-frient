export const ASSISTANT_DEFAULT_MAX_HISTORY = 8;
export const ASSISTANT_DEFAULT_MAX_PRODUCTS = 5;
export const ASSISTANT_DEFAULT_MAX_KNOWLEDGE = 6;
export const ASSISTANT_DEFAULT_MAX_ORDERS = 3;
export const ASSISTANT_DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
export const ASSISTANT_DEFAULT_RATE_LIMIT_MAX = 12;
export const ASSISTANT_MAX_MESSAGE_LENGTH = 1_200;

export const ASSISTANT_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
export const ASSISTANT_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export interface AssistantRuntimeConfig {
  maxHistory: number;
  maxProducts: number;
  maxKnowledge: number;
  maxOrders: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];

  if (typeof raw !== "string") {
    return fallback;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getAssistantRuntimeConfig(): AssistantRuntimeConfig {
  return {
    maxHistory: readPositiveIntegerEnv(
      "ASSISTANT_MAX_HISTORY",
      ASSISTANT_DEFAULT_MAX_HISTORY,
    ),
    maxProducts: readPositiveIntegerEnv(
      "ASSISTANT_MAX_PRODUCTS",
      ASSISTANT_DEFAULT_MAX_PRODUCTS,
    ),
    maxKnowledge: readPositiveIntegerEnv(
      "ASSISTANT_MAX_KNOWLEDGE",
      ASSISTANT_DEFAULT_MAX_KNOWLEDGE,
    ),
    maxOrders: readPositiveIntegerEnv(
      "ASSISTANT_MAX_ORDERS",
      ASSISTANT_DEFAULT_MAX_ORDERS,
    ),
    rateLimitWindowMs: readPositiveIntegerEnv(
      "ASSISTANT_RATE_LIMIT_WINDOW_MS",
      ASSISTANT_DEFAULT_RATE_LIMIT_WINDOW_MS,
    ),
    rateLimitMax: readPositiveIntegerEnv(
      "ASSISTANT_RATE_LIMIT_MAX",
      ASSISTANT_DEFAULT_RATE_LIMIT_MAX,
    ),
  };
}
