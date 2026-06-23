import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Container from "@/components/ui/container";
import ContentSection from "@/components/content-section";
import getContentBlocks from "@/actions/get-content-blocks";
import { buildAlternates } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://liletti.md";

export const revalidate = 0;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "About" });
    return {
        title: t("title"),
        description: t("intro"),
        alternates: buildAlternates(BASE, locale, "/about"),
    };
}

const AboutPage = async ({
    params,
}: {
    params: Promise<{ locale: string }>;
}) => {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations("About");
    const blocks = await getContentBlocks("brand-story");

    return (
        <div className="bg-white">
            <Container>
                <div className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                    <header className="max-w-3xl mb-12 sm:mb-16">
                        <h1 className="text-3xl font-light tracking-wide uppercase text-ink sm:text-4xl">
                            {t("title")}
                        </h1>
                        <p className="mt-4 text-sm leading-relaxed text-muted-strong sm:text-base">
                            {t("intro")}
                        </p>
                    </header>
                    <ContentSection
                        blocks={blocks}
                        locale={locale}
                        emptyMessage={t("empty")}
                    />
                </div>
            </Container>
        </div>
    );
};

export default AboutPage;
