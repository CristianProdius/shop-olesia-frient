import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://liletti.md";

async function fetchPaths(): Promise<string[]> {
  // Static paths now; product/category paths added once a server fetch helper exists.
  return ["/", "/about", "/atelier"];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = await fetchPaths();
  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${path === "/" ? "" : path}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, `${BASE}/${l}${path === "/" ? "" : path}`])
      ),
    }))
  );
}
