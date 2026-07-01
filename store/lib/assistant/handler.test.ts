import { describe, expect, it } from "vitest";

import { handleAssistantRequest } from "./handler";

describe("handleAssistantRequest", () => {
  it("returns invalid for empty messages", async () => {
    const response = await handleAssistantRequest(
      { locale: "en", messages: [] },
      {
        apiKey: undefined,
        model: "test-model",
        customerId: null,
        loadProducts: async () => [],
        loadFaqs: async () => [],
        loadContentBlocks: async () => [],
        loadSignedInOrders: async () => [],
        generate: async () => {
          throw new Error("should not call provider");
        },
      },
    );

    expect(response.status).toBe("invalid");
  });

  it("returns offline when the key is missing", async () => {
    const response = await handleAssistantRequest(
      {
        locale: "en",
        messages: [{ role: "user", content: "Help me choose a dress" }],
      },
      {
        apiKey: undefined,
        model: "test-model",
        customerId: null,
        loadProducts: async () => [],
        loadFaqs: async () => [],
        loadContentBlocks: async () => [],
        loadSignedInOrders: async () => [],
        generate: async () => {
          throw new Error("should not call provider");
        },
      },
    );

    expect(response.status).toBe("offline");
    expect(response.products).toEqual([]);
  });

  it("grounds configured responses with products and knowledge", async () => {
    const response = await handleAssistantRequest(
      {
        locale: "en",
        messages: [{ role: "user", content: "silk delivery" }],
      },
      {
        apiKey: "sk-test",
        model: "test-model",
        customerId: null,
        loadProducts: async () => [],
        loadFaqs: async () => [],
        loadContentBlocks: async () => [],
        loadSignedInOrders: async () => [],
        generate: async ({ latestUserMessage }) => ({
          status: "ok",
          message: `Grounded response for ${latestUserMessage}`,
          products: [],
          sources: [],
          orders: [],
          followups: ["Show evening dresses"],
        }),
      },
    );

    expect(response.status).toBe("ok");
    expect(response.message).toContain("silk delivery");
    expect(response.followups).toEqual(["Show evening dresses"]);
  });

  it("does not call the generator for signed-out order questions", async () => {
    const response = await handleAssistantRequest(
      {
        locale: "en",
        messages: [{ role: "user", content: "Where is my order?" }],
      },
      {
        apiKey: "sk-test",
        model: "test-model",
        customerId: null,
        loadProducts: async () => [],
        loadFaqs: async () => [],
        loadContentBlocks: async () => [],
        loadSignedInOrders: async () => [],
        generate: async () => {
          throw new Error("should not call provider");
        },
      },
    );

    expect(response.status).toBe("ok");
    expect(response.message).toContain("sign in");
  });
});
