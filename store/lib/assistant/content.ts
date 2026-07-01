import type { ContentBlock, Faq } from "@/types";

import { localizedField } from "../i18n-content";
import { getAssistantRuntimeConfig } from "./config";
import type { AssistantKnowledgeSource, AssistantLocale } from "./types";

function clean(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().trim();
}

function includesAll(text: string, query: string): boolean {
  const words = clean(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return false;
  }

  return words.every((word) => text.includes(word));
}

function excerpt(value: string): string {
  return value.length > 220 ? `${value.slice(0, 217).trim()}...` : value;
}

export function searchStoreKnowledge(input: {
  query: string;
  locale: AssistantLocale;
  faqs: Faq[];
  contentBlocks: ContentBlock[];
  limit?: number;
}): AssistantKnowledgeSource[] {
  const results: AssistantKnowledgeSource[] = [];

  for (const item of input.faqs) {
    if (!item.isPublished) {
      continue;
    }

    const category = localizedField(
      item.categoryI18n,
      input.locale,
      item.category ?? "FAQ",
    );
    const question = localizedField(
      item.questionI18n,
      input.locale,
      item.question,
    );
    const answer = localizedField(item.answerI18n, input.locale, item.answer);
    const haystack = clean(`${category} ${question} ${answer}`);
    if (!includesAll(haystack, input.query)) {
      continue;
    }

    results.push({
      id: item.id,
      type: "faq",
      label: category || "FAQ",
      excerpt: excerpt(answer || question),
    });
  }

  for (const item of input.contentBlocks) {
    if (!item.isPublished) {
      continue;
    }

    const heading = localizedField(
      item.headingI18n,
      input.locale,
      item.heading ?? "",
    );
    const body = localizedField(item.bodyI18n, input.locale, item.body ?? "");
    const haystack = clean(`${item.type} ${heading} ${body}`);
    if (!includesAll(haystack, input.query)) {
      continue;
    }

    results.push({
      id: item.id,
      type: "content",
      label: heading || item.type,
      excerpt: excerpt(body || heading),
    });
  }

  return results.slice(
    0,
    input.limit ?? getAssistantRuntimeConfig().maxKnowledge,
  );
}
