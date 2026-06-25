"use client";

import { useMemo, useState } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/ui/product-card";
import { localizedField } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";
import CategoryToolbar, { SortKey } from "./category-toolbar";

interface ProductGridProps {
    products: Product[];
    locale: string;
}

const DESKTOP_DENSITY_CLASS: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
};

const MOBILE_DENSITY_CLASS: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, locale }) => {
    const [sort, setSort] = useState<SortKey>("newest");
    const [density, setDensity] = useState<number>(3);

    const sortedProducts = useMemo(() => {
        const list = [...products];
        switch (sort) {
            case "oldest":
                return list.reverse();
            case "priceLow":
                return list.sort((a, b) => Number(a.price) - Number(b.price));
            case "priceHigh":
                return list.sort((a, b) => Number(b.price) - Number(a.price));
            case "nameAsc":
                return list.sort((a, b) =>
                    localizedField(a.nameI18n, locale, a.name).localeCompare(
                        localizedField(b.nameI18n, locale, b.name),
                        locale
                    )
                );
            case "newest":
            default:
                return list;
        }
    }, [products, sort, locale]);

    // Mobile density only supports 1/2 columns.
    const mobileColumns = density >= 2 ? 2 : 1;

    return (
        <div>
            <CategoryToolbar
                sort={sort}
                onSortChange={setSort}
                density={density}
                onDensityChange={setDensity}
            />
            <div
                className={cn(
                    "grid gap-x-4 gap-y-8 md:gap-x-14 md:gap-y-16",
                    MOBILE_DENSITY_CLASS[mobileColumns],
                    "md:grid-cols-3",
                    DESKTOP_DENSITY_CLASS[density]
                )}
            >
                {sortedProducts.map((item) => (
                    <ProductCard key={item.id} data={item} />
                ))}
            </div>
        </div>
    );
};

export default ProductGrid;
