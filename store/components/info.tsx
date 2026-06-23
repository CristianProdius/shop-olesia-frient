"use client";

import { Product } from "@/types";
import Currency from "@/components/ui/currency";
import Button from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { localizedField } from "@/lib/i18n-content";

interface InfoProps {
    data: Product;
}
const Info: React.FC<InfoProps> = ({ data }) => {
    const t = useTranslations("Product");
    const locale = useLocale();

    const description = localizedField(data.descriptionI18n, locale, data.description ?? "");
    const materials = localizedField(data.materialI18n, locale, data.material ?? "");
    const care = localizedField(data.careI18n, locale, data.care ?? "");

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">{localizedField(data.nameI18n, locale, data.name)}</h1>
            <div className="flex items-end justify-between mt-3">
                <p className="text-2xl text-gray-900">
                    <Currency value={data?.price} />
                </p>
            </div>
            <hr className="my-4" />
            <div className="flex flex-col gap-y-6">
                <div className="flex items-center gap-x-4">
                    <h3 className="font-semibold text-black">{t("size")}</h3>
                        <div>
                            {data?.size?.value}
                        </div>
                </div>
                <div className="flex items-center gap-x-4">
                    <h3 className="font-semibold text-black">{t("color")}</h3>
                    <div className="w-6 h-6 border border-gray-600 rounded-full" style={{ backgroundColor: data?.color?.value }}/>
                </div>
            </div>
            <div className="flex items-center mt-10 gap-x-4">
                <Button className="flex items-center gap-x-2">
                    {t("addToCart")}
                    <ShoppingCart />
                </Button>
            </div>
            {(description || materials || care) && (
                <div className="flex flex-col mt-10 gap-y-6">
                    {description && (
                        <div>
                            <h3 className="font-semibold text-black">{t("description")}</h3>
                            <p className="mt-2 whitespace-pre-line text-gray-700">{description}</p>
                        </div>
                    )}
                    {materials && (
                        <div>
                            <h3 className="font-semibold text-black">{t("materials")}</h3>
                            <p className="mt-2 whitespace-pre-line text-gray-700">{materials}</p>
                        </div>
                    )}
                    {care && (
                        <div>
                            <h3 className="font-semibold text-black">{t("care")}</h3>
                            <p className="mt-2 whitespace-pre-line text-gray-700">{care}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
     );
}
 
export default Info;