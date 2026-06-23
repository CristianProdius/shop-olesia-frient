import getProduct from "@/actions/get-product";
import getProducts from "@/actions/get-products";
import Gallery from "@/components/gallery";
import Info from "@/components/info";
import ProductList from "@/components/product-list";
import Container from "@/components/ui/container";
import { getTranslations } from "next-intl/server";
import { localizedField } from "@/lib/i18n-content";
import { buildAlternates, productJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://liletti.md";

type Params = Promise<{ productId: string; locale: string }>

const ProductPage = async ({ params }: { params: Params }) => {
    const t = await getTranslations("Product");
    const { productId, locale } = await params;
    const product = await getProduct(productId);

    const productName = localizedField(product.nameI18n, locale, product.name);
    const categoryName = localizedField(
        product.category?.nameI18n,
        locale,
        product.category?.name ?? "",
    );
    const canonical = buildAlternates(BASE, locale, `/product/${product.id}`).canonical;

    const productLd = productJsonLd({
        name: productName,
        description: productName,
        images: product.images.map((i) => i.url),
        price: Number(product.price),
        currency: "MDL",
        url: canonical,
    });
    const breadcrumbLd = breadcrumbJsonLd([
        { name: "LILETTI", url: `${BASE}/${locale}` },
        {
            name: categoryName,
            url: `${BASE}/${locale}/category/${product.category?.id ?? ""}`,
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
        <div className="bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            <Container>
                <div className="px-4 py-10 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
                        {/* Gallery */}
                        <Gallery images={product.images} />
                        <div className="px-4 mt-0 sm:mt-16 sm:px-0 lg:mt-0">
                            {/* Info */}
                            <Info data={product} />
                        </div>
                    </div>
                    <hr className="my-10"/>
                    <ProductList title={t("relatedItems")} items={suggestProducts} />
                </div>
            </Container>
        </div>
     );
}
 
export default ProductPage;