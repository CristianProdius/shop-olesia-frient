import { Product } from "@/types";
import { cn } from "@/lib/utils";
import NoResults from "@/components/ui/no-results";
import ProductCard from "@/components/ui/product-card";

interface ProductListProps {
    title: string;
    items: Product[];
    // "wide" packs more columns for the full-width homepage; "default" keeps 3-up.
    cols?: "default" | "wide";
}

const ProductList: React.FC<ProductListProps> = ({ title, items, cols = "default" }) => {
    return (
        <div>
            <h2 className="heading-luxe text-text text-2xl">{title}</h2>
            <div className="rule mt-4 mb-10" aria-hidden="true" />
            {items?.length === 0 && <NoResults />}
            <div
                className={cn(
                    "grid gap-x-4 gap-y-10",
                    cols === "wide"
                        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-x-8"
                        : "grid-cols-2 md:grid-cols-3 md:gap-x-14 md:gap-y-16",
                )}
            >
                {items.map(item => (
                    <div key={item.id}>
                        <ProductCard key={item.id} data={item} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProductList;