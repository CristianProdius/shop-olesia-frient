import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/content", async () => import("./content"));

import getBillboards from "../actions/get-billboards";
import getStats from "../actions/get-stats";

describe("storefront data actions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns no billboards when the admin API fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(getBillboards()).resolves.toEqual([]);
  });

  it("returns no stats when the admin API fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(getStats()).resolves.toEqual([]);
  });
});
