import { describe, expect, it } from "vitest";

import { buildAssistantPrompt, sanitizeMessages } from "./prompt";

describe("sanitizeMessages", () => {
  it("keeps only supported roles and trimmed content", () => {
    const messages = sanitizeMessages([
      { role: "user", content: " hello " },
      { role: "assistant", content: " hi " },
      { role: "user", content: "   " },
      { role: "system", content: "secret" },
    ]);

    expect(messages).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ]);
  });

  it("keeps only the latest messages", () => {
    const messages = sanitizeMessages(
      Array.from({ length: 12 }, (_, index) => ({
        role: "user" as const,
        content: `message ${index}`,
      })),
      4,
    );

    expect(messages).toHaveLength(4);
    expect(messages[0].content).toBe("message 8");
  });

  it("truncates overlong messages", () => {
    const messages = sanitizeMessages([
      { role: "user", content: "a".repeat(1_300) },
    ]);

    expect(messages[0].content).toHaveLength(1_200);
  });
});

describe("buildAssistantPrompt", () => {
  it("includes locale and guardrails", () => {
    const prompt = buildAssistantPrompt("ro");

    expect(prompt).toContain("Answer in ro");
    expect(prompt).toContain("Never invent stock");
    expect(prompt).toContain("Never use customerId");
  });
});
