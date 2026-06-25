import getCategories from "@/actions/get-categories";
import getCategory from "@/actions/get-category";
import getColors from "@/actions/get-colors";
import getProducts from "@/actions/get-products";
import getSizes from "@/actions/get-sizes";
import Container from "@/components/ui/container";
import Filter from "./components/filter";
import JsonLd from "@/components/json-ld";
import NoResults from "@/components/ui/no-results";
import ProductGrid from "./components/product-grid";
import CategorySidebar from "./components/category-sidebar";
import MobileFilters from "./components/mobile-filters";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedField } from "@/lib/i18n-content";
import { SITE_URL, alternates } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 0;

type Params = Promise<{ categoryId: string }>
type SearchParams = Promise<{ colorId: string, sizeId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const locale = await getLocale();
    const { categoryId } = await params;
    const category = await getCategory(categoryId);
    const categoryName = localizedField(category?.nameI18n, locale, category?.name);
    const description = `Shop ${categoryName} at LILETTI.`;
    const meta = alternates(locale, `/category/${categoryId}`);

    return {
        title: categoryName,
        description,
        alternates: meta,
        openGraph: {
            type: "website",
            title: categoryName,
            description,
            url: meta.canonical,
        },
    };
}

const CategoryPage = async ({ params, searchParams }: { params: Params, searchParams: SearchParams }) => {
    const { categoryId } = await params;
    const { colorId, sizeId } = await searchParams;
    const products = await getProducts({ categoryId: categoryId, colorId: colorId, sizeId: sizeId })
    const sizes = await getSizes();
    const colors = await getColors();
    const category = await getCategory(categoryId)
    const categories = await getCategories();
    const t = await getTranslations("CategoryPage");
    const tNav = await getTranslations("Navbar");
    const locale = await getLocale();

    const categoryName = localizedField(category?.nameI18n, locale, category?.name);

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: tNav("home"),
                item: `${SITE_URL}/${locale}`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: categoryName,
                item: alternates(locale, `/category/${categoryId}`).canonical,
            },
        ],
    };

    return (
        <div className="bg-white">
            <JsonLd data={breadcrumbLd} />
            <Container className="py-20 md:py-24">
                <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-x-10 lg:items-start">
                    {/* Sidebar (desktop) — sticks below the navbar while the grid scrolls */}
                    <aside className="hidden lg:block lg:sticky lg:top-36 lg:self-start lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
                        <CategorySidebar
                            categories={categories}
                            activeCategoryId={categoryId}
                            heading={t("categories")}
                            locale={locale}
                        />
                        <div className="mt-12">
                            <Filter
                                valueKey="sizeId"
                                name={t("sizes")}
                                data={sizes}
                                locale={locale}
                            />
                            <Filter
                                valueKey="colorId"
                                name={t("colors")}
                                data={colors}
                                locale={locale}
                            />
                        </div>
                    </aside>

                    {/* Main content */}
                    <main>
                        {/* Mobile filters trigger */}
                        <div className="mb-6 lg:hidden">
                            <MobileFilters
                                sizes={sizes}
                                colors={colors}
                                categories={categories}
                                activeCategoryId={categoryId}
                                sizesLabel={t("sizes")}
                                colorsLabel={t("colors")}
                                locale={locale}
                            />
                        </div>

                        {/* Page title + rule */}
                        <div className="mt-[18px]">
                            <h1 className="heading-luxe text-2xl text-ink">
                                {categoryName}
                            </h1>
                        </div>
                        <hr className="rule mb-7 mt-[18px]" />

                        {products?.length === 0 ? (
                            <NoResults />
                        ) : (
                            <ProductGrid products={products} locale={locale} />
                        )}
                    </main>
                </div>
            </Container>
        </div>
    );
}

export default CategoryPage;
