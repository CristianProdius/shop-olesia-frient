import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Container from "@/components/ui/container";
import { SITE_URL, buildAlternates } from "@/lib/seo";
import CustomOrderForm from "./components/custom-order-form";
import SizeGuideTable from "@/components/size-guide";
import getSizeGuides from "@/actions/get-size-guides";

export const revalidate = 0;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "CustomOrder" });
    return {
        title: t("title"),
        description: t("intro"),
        alternates: buildAlternates(SITE_URL, locale, "/custom-order"),
    };
}

const CustomOrderPage = async ({
    params,
}: {
    params: Promise<{ locale: string }>;
}) => {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations("CustomOrder");
    const guideLines = t.raw("measurementGuideLines") as string[];
    const sizeGuides = await getSizeGuides();

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

                    <div className="grid gap-12 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <CustomOrderForm />
                        </div>

                        <aside className="lg:col-span-5">
                            <h2 className="text-xs tracking-wide uppercase text-muted-strong">
                                {t("measurementGuide")}
                            </h2>
                            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-text">
                                {Array.isArray(guideLines)
                                    ? guideLines.map((line, i) => (
                                          <li key={i}>{line}</li>
                                      ))
                                    : null}
                            </ul>
                            <SizeGuideTable guides={sizeGuides} className="mt-6" />
                        </aside>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default CustomOrderPage;
