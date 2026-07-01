import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo", async () => import("./seo"));

import sitemap from "../app/sitemap";

describe("sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns static entries without fetching when the API URL is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubGlobal("fetch", fetchMock);

    const entries = await sitemap();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(entries.some((item) => item.url.endsWith("/en/faq"))).toBe(true);
  });
});
