import Container from "@/components/ui/container";
import Billboard from "@/components/billboard";
import getBillboards from "@/actions/get-billboards";
import getProducts from "@/actions/get-products";
import ProductList from "@/components/product-list";
import { getTranslations } from "next-intl/server";

export const revalidate = 0;

const HomePage = async () => {
    const t = await getTranslations('Home');
    // Use the first available billboard as the hero (no hardcoded id).
    const billboards = await getBillboards();
    const billboard = billboards[0];
    const products = await getProducts({ isFeatured: true })
    return (
        <Container>
            <div className="pb-10 space-y-10">
                <Billboard data={billboard} />
                <div className="flex flex-col px-4 gap-y-8 sm:px-6 lg:px-8">
                    <ProductList title={t('featuredProducts')} items={products} />
                </div>
            </div>
        </Container>
    )
}

export default HomePage;