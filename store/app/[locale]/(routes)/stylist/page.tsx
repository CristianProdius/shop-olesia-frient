import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import StylistClient from "@/components/stylist/stylist-client";
import Container from "@/components/ui/container";
import { SITE_URL, buildAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Stylist");
  const meta = buildAlternates(SITE_URL, locale, "/stylist");

  return {
    title: t("title"),
    description: t("intro"),
    alternates: meta,
  };
}

const StylistPage = () => (
  <div className="bg-background">
    <Container>
      <StylistClient />
    </Container>
  </div>
);

export default StylistPage;
