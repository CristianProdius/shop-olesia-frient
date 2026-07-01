import getProduct from "@/actions/get-product";
import getProducts from "@/actions/get-products";
import getReviews from "@/actions/get-reviews";
import Gallery from "@/components/gallery";
import Info from "@/components/info";
import JsonLd from "@/components/json-ld";
import ProductList from "@/components/product-list";
import ProductReviews from "@/components/product-reviews";
import Container from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import {
    SITE_URL,
    buildAlternates,
    productJsonLd,
    breadcrumbJsonLd,
    aggregateRatingJsonLd,
    ORG_NAME,
} from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type Params = Promise<{ productId: string; locale: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const locale = await getLocale();
    const { productId } = await params;
    const product = await getProduct(productId);
    if (!product) return {};

    const name = localizedField(product.nameI18n, locale, product.name);
    const description =
        localizedField(product.descriptionI18n, locale, product.description ?? "") ||
        `${name} — ${ORG_NAME}`;
    const meta = buildAlternates(SITE_URL, locale, `/product/${productId}`);

    return {
        title: name,
        description,
        alternates: meta,
        openGraph: {
            type: "website",
            title: name,
            description,
            images: product.images ? product.images.map((i) => i.url) : [],
            url: meta.canonical,
        },
        twitter: { card: "summary_large_image" },
    };
}

const ProductPage = async ({ params }: { params: Params }) => {
    const t = await getTranslations("Product");
    const tNav = await getTranslations("Navbar");
    const locale = await getLocale();
    const { productId } = await params;
    const product = await getProduct(productId);
    if (!product) notFound();
    const reviews = await getReviews(productId);
    const aggregateRating = aggregateRatingJsonLd(reviews) ?? undefined;

    const productName = localizedField(product.nameI18n, locale, product.name);
    const categoryName = localizedField(
        product.category?.nameI18n,
        locale,
        product.category?.name ?? "",
    );
    const canonical = buildAlternates(SITE_URL, locale, `/product/${product.id}`).canonical;

    const productLd = productJsonLd({
        name: productName,
        description: localizedField(product.descriptionI18n, locale, productName),
        images: product.images.map((i) => i.url),
        price: Number(product.price),
        currency: "MDL",
        url: canonical,
        aggregateRating,
    });
    const breadcrumbLd = breadcrumbJsonLd([
        { name: "LILETTI", url: `${SITE_URL}/${locale}` },
        {
            name: categoryName,
            url: `${SITE_URL}/${locale}/category/${product.category?.id ?? ""}`,
        },
        { name: productName, url: canonical },
    ]);

    // Related items: same category, excluding the current product. Rotate the
    // list by a stable per-product seed and cap it, so a large category (e.g.
    // mostly dresses) doesn't show the identical set on every product page.
    const related = (await getProducts({ categoryId: product?.category?.id }))
        .filter((p) => p.id !== product.id);
    const seed = productId.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const start = related.length ? seed % related.length : 0;
    const suggestProducts = [...related.slice(start), ...related.slice(0, start)].slice(0, 8);

    return (
        <div className="bg-background">
            <JsonLd data={[productLd, breadcrumbLd]} />
            <Container>
                <div className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6 md:py-24 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="mb-10 text-xs text-muted-strong">
                        <ol className="flex flex-wrap items-center gap-x-2">
                            <li>
                                <Link href="/" className="hover:text-text">
                                    {tNav("home")}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li>
                                <Link
                                    href={`/category/${product.category?.id}`}
                                    className="hover:text-text"
                                >
                                    {categoryName}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li className="text-text">{productName}</li>
                        </ol>
                    </nav>

                    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-12">
                        {/* Gallery */}
                        <Gallery images={product.images} alt={productName} />
                        <div className="mt-10 lg:mt-0">
                            {/* Info */}
                            <Info data={product} />
                        </div>
                    </div>
                    <hr className="my-16 border-border" />
                    <ProductReviews reviews={reviews} locale={locale} />
                    <hr className="my-16 border-border" />
                    <ProductList title={t("relatedItems")} items={suggestProducts} cols="wide" />
                </div>
            </Container>
        </div>
    );
}

export default ProductPage;
