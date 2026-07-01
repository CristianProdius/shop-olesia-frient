import type { AssistantLocale, AssistantStatus } from "./types";

export const ASSISTANT_DEFAULT_MAX_HISTORY = 8;
export const ASSISTANT_DEFAULT_MAX_PRODUCTS = 5;
export const ASSISTANT_DEFAULT_MAX_KNOWLEDGE = 6;
export const ASSISTANT_DEFAULT_MAX_ORDERS = 3;
export const ASSISTANT_DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
export const ASSISTANT_DEFAULT_RATE_LIMIT_MAX = 12;
export const ASSISTANT_MAX_MESSAGE_LENGTH = 1_200;

export const ASSISTANT_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
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

export function normalizeAssistantLocale(
  locale: string | undefined,
): AssistantLocale {
  if (locale === "ro" || locale === "ru" || locale === "en") {
    return locale;
  }

  return "en";
}

export function assistantConfigured(apiKey: string | undefined): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

const FALLBACK_MESSAGES = {
  invalid: {
    en: "Please send a message so I can help.",
    ro: "Trimite un mesaj ca sa te pot ajuta.",
    ru: "Напишите сообщение, и я помогу.",
  },
  offline: {
    en: "The shop assistant is not configured yet. You can still browse products, FAQ, and your account.",
    ro: "Asistentul magazinului nu este configurat inca. Poti naviga produsele, FAQ-ul si contul tau.",
    ru: "Помощник магазина пока не настроен. Вы можете посмотреть товары, FAQ и свой аккаунт.",
  },
  error: {
    en: "I could not answer right now. Please try again or check the FAQ and product pages.",
    ro: "Nu pot raspunde acum. Incearca din nou sau verifica FAQ-ul si paginile produselor.",
    ru: "Сейчас я не могу ответить. Попробуйте еще раз или посмотрите FAQ и страницы товаров.",
  },
  rate_limited: {
    en: "Too many assistant requests. Please wait a moment and try again.",
    ro: "Prea multe solicitari catre asistent. Asteapta putin si incearca din nou.",
    ru: "Слишком много запросов к помощнику. Подождите немного и попробуйте снова.",
  },
  ok: {
    en: "",
    ro: "",
    ru: "",
  },
} satisfies Record<AssistantStatus, Record<AssistantLocale, string>>;

export function fallbackMessage(
  status: Exclude<AssistantStatus, "ok">,
  locale: AssistantLocale,
): string {
  return FALLBACK_MESSAGES[status][locale];
}
