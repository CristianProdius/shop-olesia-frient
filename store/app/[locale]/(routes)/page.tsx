import Container from "@/components/ui/container";
import Billboard from "@/components/billboard";
import ProductList from "@/components/product-list";
import ValueStrip from "@/components/value-strip";
import Newsletter from "@/components/newsletter";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import getBillboards from "@/actions/get-billboards";
import getCategories from "@/actions/get-categories";
import getProducts from "@/actions/get-products";
import { localizedField } from "@/lib/i18n-content";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { alternates } from "@/lib/seo";

export const revalidate = 0;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const description =
        "Shop the latest arrivals from LILETTI — minimal-luxury womenswear with refined silhouettes and elevated essentials, curated for the modern wardrobe.";
    const canonical = `${alternates(locale, "").canonical}`;
    return {
        title: "New In",
        description,
        alternates: alternates(locale, ""),
        openGraph: {
            type: "website",
            siteName: "LILETTI",
            locale,
            url: canonical,
            title: "New In",
            description,
            images: [{ url: "/og-default.jpg" }],
        },
        twitter: { card: "summary_large_image" },
    };
}

const HomePage = async () => {
    const t = await getTranslations("Home");
    const locale = await getLocale();

    const billboards = await getBillboards();
    const hero = billboards[0];
    const editorial = billboards[1] ?? billboards[0];
    const categories = (await getCategories()) ?? [];
    const products = await getProducts({ isFeatured: true });

    // Map billboardId -> image so each category tile can show its hero image.
    const billboardImage = new Map(billboards.map((b) => [b.id, b.imageUrl]));
    const firstCategory = categories[0];
    const shopHref = firstCategory ? `/category/${firstCategory.id}` : "/";

    return (
        <div>
            {/* Full-bleed hero with CTA */}
            <Billboard data={hero} ctaHref={shopHref} ctaLabel={t("shopNow")} />

            {/* Trust / value band */}
            <ValueStrip />

            {/* Shop by Category */}
            {categories.length > 0 && (
                <Container>
                    <section className="py-20 md:py-24">
                        <h2 className="heading-luxe text-2xl text-ink">{t("shopByCategory")}</h2>
                        <hr className="rule mb-10 mt-5" />
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                            {categories.map((category) => {
                                const name = localizedField(category.nameI18n, locale, category.name);
                                const img = category.billboardId
                                    ? billboardImage.get(category.billboardId)
                                    : undefined;
                                return (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.id}`}
                                        className="group block"
                                    >
                                        <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
                                            {img && (
                                                <Image
                                                    fill
                                                    src={img}
                                                    alt={name}
                                                    sizes="(min-width: 768px) 25vw, 50vw"
                                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/30 transition-colors duration-200 ease-out group-hover:bg-black/40" />
                                            <div className="absolute inset-x-0 bottom-0 p-5 text-center">
                                                <span className="text-on-dark text-sm font-bold uppercase tracking-[0.12em] md:text-base text-balance">
                                                    {name}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </Container>
            )}

            {/* Editorial split banner — image + brand message + CTA */}
            <section className="grid md:grid-cols-2">
                <div className="relative min-h-[52vh] bg-placeholder md:min-h-[78vh]">
                    {editorial?.imageUrl && (
                        <Image
                            fill
                            src={editorial.imageUrl}
                            alt=""
                            sizes="(min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                        />
                    )}
                </div>
                <div className="flex items-center justify-center bg-surface px-8 py-16 md:px-16 md:py-0">
                    <div className="max-w-md text-center md:text-left">
                        <span className="eyebrow">{t("getInspired")}</span>
                        <h2 className="heading-luxe mt-4 text-2xl text-ink md:text-3xl text-balance">
                            {t("ethosTitle")}
                        </h2>
                        <p className="mt-5 text-sm leading-relaxed text-muted-strong text-pretty">
                            {t("ethosBody")}
                        </p>
                        <Link
                            href={shopHref}
                            className="mt-9 inline-flex items-center justify-center border border-ink bg-ink px-9 py-4 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-transparent hover:text-ink"
                        >
                            {t("shopAll")}
                        </Link>
                    </div>
                </div>
            </section>

            {/* New In — a curated taste, with a link to the full catalog */}
            <Container>
                <section className="py-20 md:py-24">
                    <ProductList title={t("newIn")} items={products.slice(0, 8)} cols="wide" />
                    {firstCategory && (
                        <div className="mt-12 text-center">
                            <Link
                                href={shopHref}
                                className="inline-flex items-center justify-center border border-border-strong px-9 py-4 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:bg-ink hover:text-white"
                            >
                                {t("shopAll")}
                            </Link>
                        </div>
                    )}
                </section>
            </Container>

            {/* Newsletter signup */}
            <Newsletter />
        </div>
    );
};

export default HomePage;
