import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createDefaultAssistantDeps: vi.fn(),
  getContentBlocks: vi.fn(),
  getCustomerSession: vi.fn(),
  getFaqs: vi.fn(),
  getMyOrders: vi.fn(),
  getProducts: vi.fn(),
  handleAssistantRequest: vi.fn(),
  rateLimitCheck: vi.fn(),
}));

vi.mock("@/actions/get-content-blocks", () => ({
  default: mocks.getContentBlocks,
}));

vi.mock("@/actions/get-faqs", () => ({
  default: mocks.getFaqs,
}));

vi.mock("@/actions/get-my-orders", () => ({
  default: mocks.getMyOrders,
}));

vi.mock("@/actions/get-products", () => ({
  default: mocks.getProducts,
}));

vi.mock("@/lib/server-auth", () => ({
  getCustomerSession: mocks.getCustomerSession,
}));

vi.mock("@/lib/assistant/config", async () => import("./config"));

vi.mock("@/lib/assistant/handler", () => ({
  createDefaultAssistantDeps: mocks.createDefaultAssistantDeps,
  handleAssistantRequest: mocks.handleAssistantRequest,
}));

vi.mock("@/lib/assistant/rate-limit", () => ({
  assistantRateLimiter: {
    check: mocks.rateLimitCheck,
  },
}));

async function importRoute() {
  return import("../../app/api/assistant/route");
}

describe("POST /api/assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createDefaultAssistantDeps.mockReturnValue({ marker: "deps" });
    mocks.getCustomerSession.mockResolvedValue({ user: { id: "customer-1" } });
    mocks.handleAssistantRequest.mockResolvedValue({
      status: "ok",
      message: "Assistant reply",
      products: [],
      sources: [],
      orders: [],
      followups: [],
    });
    mocks.rateLimitCheck.mockReturnValue({
      allowed: true,
      remaining: 11,
      resetAt: 61_000,
    });
  });

  it("validates JSON requests before calling the assistant handler", async () => {
    const { POST } = await importRoute();

    const response = await POST(
      new Request("https://store.test/api/assistant", {
        method: "POST",
        body: "{",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe("invalid");
    expect(mocks.handleAssistantRequest).not.toHaveBeenCalled();
  });

  it("returns a localized 429 when the fixed-window limit is exceeded", async () => {
    mocks.rateLimitCheck.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: 61_000,
    });
    const { POST } = await importRoute();

    const response = await POST(
      new Request("https://store.test/api/assistant", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        },
        body: JSON.stringify({ locale: "ro", messages: [] }),
      }),
    );
    const body = await response.json();

    expect(mocks.rateLimitCheck).toHaveBeenCalledWith(
      "assistant:203.0.113.10",
    );
    expect(response.status).toBe(429);
    expect(body.status).toBe("rate_limited");
    expect(body.message).toContain("solicitari");
    expect(mocks.handleAssistantRequest).not.toHaveBeenCalled();
  });

  it("scopes dependencies to the signed-in customer and action loaders", async () => {
    const { POST } = await importRoute();
    const payload = {
      locale: "en",
      messages: [{ role: "user" as const, content: "Help me choose a dress" }],
    };

    const response = await POST(
      new Request("https://store.test/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Assistant reply");
    expect(mocks.createDefaultAssistantDeps).toHaveBeenCalledWith({
      customerId: "customer-1",
      loadProducts: expect.any(Function),
      loadFaqs: expect.any(Function),
      loadContentBlocks: expect.any(Function),
      loadSignedInOrders: expect.any(Function),
    });
    expect(mocks.handleAssistantRequest).toHaveBeenCalledWith(payload, {
      marker: "deps",
    });

    const depsInput = mocks.createDefaultAssistantDeps.mock
      .calls[0][0] as Parameters<typeof import("./handler").createDefaultAssistantDeps>[0];
    await depsInput.loadProducts();
    await depsInput.loadFaqs();
    await depsInput.loadContentBlocks();
    await depsInput.loadSignedInOrders("customer-2");

    expect(mocks.getProducts).toHaveBeenCalledWith({});
    expect(mocks.getFaqs).toHaveBeenCalledWith();
    expect(mocks.getContentBlocks).toHaveBeenCalledWith();
    expect(mocks.getMyOrders).toHaveBeenCalledWith("customer-2");
  });

  it("returns 400 when the handler rejects a valid payload as invalid", async () => {
    mocks.handleAssistantRequest.mockResolvedValue({
      status: "invalid",
      message: "Invalid",
      products: [],
      sources: [],
      orders: [],
      followups: [],
    });
    const { POST } = await importRoute();

    const response = await POST(
      new Request("https://store.test/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: "en", messages: [] }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
