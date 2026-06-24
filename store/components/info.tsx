"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Product } from "@/types";
import Currency from "@/components/ui/currency";
import Button from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { localizedField } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";
import useCart, { CartLine } from "@/hooks/use-cart";
import {
    distinctColors,
    distinctSizes,
    isCombinationAvailable,
    resolveVariant,
    stockState,
} from "@/lib/variants";

interface InfoProps {
    data: Product;
}
const Info: React.FC<InfoProps> = ({ data }) => {
    const t = useTranslations("Product");
    const locale = useLocale();
    const cart = useCart();

    // Fall back to a synthetic single-variant list when (older) products carry
    // only scalar size/color, so single-variant UX is preserved everywhere.
    const variants = useMemo(() => {
        if (data.variants && data.variants.length) return data.variants;
        if (data.size && data.color) {
            return [
                {
                    id: data.id,
                    stockQty: 1,
                    sizeId: data.size.id,
                    colorId: data.color.id,
                    size: data.size,
                    color: data.color,
                },
            ];
        }
        return [];
    }, [data]);

    const sizes = useMemo(() => distinctSizes(variants), [variants]);
    const colors = useMemo(() => distinctColors(variants), [variants]);

    // Auto-select the only variant for single-variant products.
    const [sizeId, setSizeId] = useState<string | undefined>(
        variants.length === 1 ? variants[0].sizeId : undefined,
    );
    const [colorId, setColorId] = useState<string | undefined>(
        variants.length === 1 ? variants[0].colorId : undefined,
    );

    const selectedVariant = resolveVariant(variants, sizeId, colorId);
    const inStock = !!selectedVariant && selectedVariant.stockQty > 0;

    // Honest scarcity cue driven only by the selected variant's real stockQty.
    const scarcity = selectedVariant
        ? stockState(selectedVariant.stockQty)
        : undefined;

    const description = localizedField(data.descriptionI18n, locale, data.description ?? "");
    const materials = localizedField(data.materialI18n, locale, data.material ?? "");
    const care = localizedField(data.careI18n, locale, data.care ?? "");

    // Back-in-stock waitlist (shown only when the selected variant is sold out).
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const [notifyEmail, setNotifyEmail] = useState("");
    const [notifySubmitting, setNotifySubmitting] = useState(false);

    const onNotifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVariant) return;

        const trimmed = notifyEmail.trim();
        if (!EMAIL_RE.test(trimmed)) {
            toast.error(t("notifyError"));
            return;
        }

        setNotifySubmitting(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/stock-notifications`, {
                variantId: selectedVariant.id,
                email: trimmed,
                locale,
            });
            toast.success(t("notifySuccess"));
            setNotifyEmail("");
        } catch (err) {
            console.error(err);
            toast.error(t("notifyError"));
        } finally {
            setNotifySubmitting(false);
        }
    };

    const onAddToCart = () => {
        if (!selectedVariant || !inStock) return;
        const line: CartLine = {
            ...data,
            variantId: selectedVariant.id,
            selectedSize: selectedVariant.size,
            selectedColor: selectedVariant.color,
            unitPrice: data.price,
        };
        cart.addItem(line);
    };

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
                <div className="flex items-start gap-x-4">
                    <h3 className="font-semibold text-black pt-1">{t("size")}</h3>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            // A size is selectable if any in-stock variant exists for it,
                            // given the currently-selected color (when set).
                            const available = colorId
                                ? isCombinationAvailable(variants, size.id, colorId)
                                : variants.some(
                                      (v) => v.sizeId === size.id && v.stockQty > 0,
                                  );
                            const active = size.id === sizeId;
                            return (
                                <button
                                    key={size.id}
                                    type="button"
                                    disabled={!available}
                                    onClick={() => setSizeId(size.id)}
                                    className={cn(
                                        "border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through",
                                        active
                                            ? "border-black bg-black text-white"
                                            : "border-gray-300 text-black hover:border-black",
                                    )}
                                >
                                    {size.value}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex items-start gap-x-4">
                    <h3 className="font-semibold text-black pt-1">{t("color")}</h3>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => {
                            const available = sizeId
                                ? isCombinationAvailable(variants, sizeId, color.id)
                                : variants.some(
                                      (v) => v.colorId === color.id && v.stockQty > 0,
                                  );
                            const active = color.id === colorId;
                            return (
                                <button
                                    key={color.id}
                                    type="button"
                                    disabled={!available}
                                    onClick={() => setColorId(color.id)}
                                    aria-label={localizedField(color.nameI18n, locale, color.name)}
                                    title={localizedField(color.nameI18n, locale, color.name)}
                                    className={cn(
                                        "w-7 h-7 border transition disabled:cursor-not-allowed disabled:opacity-40",
                                        active
                                            ? "ring-2 ring-black ring-offset-1"
                                            : "border-gray-400 hover:ring-1 hover:ring-black",
                                    )}
                                    style={{ backgroundColor: color.value }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="flex items-center mt-10 gap-x-4">
                <Button
                    onClick={onAddToCart}
                    disabled={!inStock}
                    className="flex items-center gap-x-2"
                >
                    {selectedVariant && !inStock
                        ? t("soldOut")
                        : !selectedVariant && (sizeId || colorId)
                          ? t("outOfStock")
                          : !selectedVariant
                            ? t("selectOptions")
                            : t("addToCart")}
                    <ShoppingCart />
                </Button>
            </div>
            {scarcity === "out" && selectedVariant && (
                <div className="mt-4">
                    <p className="text-sm text-muted-strong">{t("soldOut")}</p>
                    <p className="mt-3 text-sm font-medium text-text">{t("notifyTitle")}</p>
                    <form onSubmit={onNotifySubmit} className="flex w-full max-w-sm mt-2">
                        <label htmlFor="notify-email" className="sr-only">
                            {t("notifyEmail")}
                        </label>
                        <input
                            id="notify-email"
                            type="email"
                            value={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.value)}
                            placeholder={t("notifyEmail")}
                            className="flex-1 px-3 py-2 text-sm border border-border bg-white text-text placeholder:text-muted-strong focus:outline-none focus:border-ink"
                        />
                        <Button
                            type="submit"
                            disabled={notifySubmitting}
                            className="!rounded-none shrink-0"
                        >
                            {t("notifyButton")}
                        </Button>
                    </form>
                </div>
            )}
            {scarcity === "low" && selectedVariant && (
                <p className="mt-3 text-sm text-sale">
                    {t("onlyNLeft", { count: selectedVariant.stockQty })}
                </p>
            )}
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
