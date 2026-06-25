"use client";

import { Product } from "@/types";
import Currency from "@/components/ui/currency";
import Button from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { localizedField } from "@/lib/i18n-content";
import useCart from "@/hooks/use-cart";

interface InfoProps {
    data: Product;
}
const Info: React.FC<InfoProps> = ({ data }) => {
    const t = useTranslations("Product");
    const locale = useLocale();
    const cart = useCart();

    const onAddToCart = () => {
        cart.addItem(data);
    };

    const description = localizedField(data.descriptionI18n, locale, data.description ?? "");
    const material = localizedField(data.materialI18n, locale, data.material ?? "");
    const care = localizedField(data.careI18n, locale, data.care ?? "");

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-[0.05em] uppercase text-ink">
                {localizedField(data.nameI18n, locale, data.name)}
            </h1>
            {data.sku && (
                <p className="mt-2 text-xs uppercase tracking-[0.1em] text-muted-strong">
                    {t("sku")}: {data.sku}
                </p>
            )}
            <div className="flex items-end justify-between mt-4">
                <p className="text-xl text-text">
                    <Currency value={data?.price} />
                </p>
            </div>
            <hr className="my-6 border-border" />
            {description && (
                <p className="mb-6 text-sm leading-relaxed text-text text-pretty">
                    {description}
                </p>
            )}
            <div className="flex flex-col gap-y-6">
                <div className="flex items-center gap-x-4">
                    <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-muted-strong">
                        {t("size")}
                    </h3>
                    <div className="text-text">{data?.size?.value}</div>
                </div>
                <div className="flex items-center gap-x-4">
                    <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-muted-strong">
                        {t("color")}
                    </h3>
                    <div
                        className="w-6 h-6 border border-border rounded-none"
                        style={{ backgroundColor: data?.color?.value }}
                    />
                </div>
                {material && (
                    <div className="flex items-center gap-x-4">
                        <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-muted-strong">
                            {t("material")}
                        </h3>
                        <div className="text-sm text-text">{material}</div>
                    </div>
                )}
                {care && (
                    <div className="flex items-center gap-x-4">
                        <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-muted-strong">
                            {t("care")}
                        </h3>
                        <div className="text-sm text-text">{care}</div>
                    </div>
                )}
            </div>
            <div className="flex items-center mt-10 gap-x-4">
                <Button variant="primary" size="lg" className="gap-x-2" onClick={onAddToCart}>
                    {t("addToCart")}
                    <ShoppingCart className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default Info;
