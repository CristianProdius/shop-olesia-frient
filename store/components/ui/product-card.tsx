"use client"

import { Product } from "@/types";
import Image from "next/image";
import IconButton from "@/components/ui/icon-button";
import { Expand, ShoppingCart } from "lucide-react";
import Currency from "@/components/ui/currency";
import { useRouter } from "@/i18n/navigation";
import PreviewModal from './../preview-modal';
import usePreviewModal from "@/hooks/use-preview-modal";
import { MouseEventHandler } from 'react';
import useCart, { CartLine } from "@/hooks/use-cart";
import { useTranslations, useLocale } from "next-intl";
import { localizedField } from "@/lib/i18n-content";
import { totalStock } from "@/lib/variants";

interface ProductCard {
    data: Product;
}

const ProductCard: React.FC<ProductCard> = ({ data }) => {
    const t = useTranslations('Home');
    const tProduct = useTranslations('Product');
    const locale = useLocale();
    // Sold-out only when every variant is out of stock — never a fabricated cue.
    const soldOut = (data.variants?.length ?? 0) > 0 && totalStock(data.variants ?? []) === 0;
    const cart = useCart();
    const previewModal = usePreviewModal();
    const router = useRouter();
    const handleClick = () => {
        router.push(`/product/${data?.id}`)
    }

    const onPreview: MouseEventHandler<HTMLButtonElement> = (event) => {
        event.stopPropagation();
        previewModal.onOpen(data);
    }

    const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
        event.stopPropagation();
        // Quick-add only works when there is a single, unambiguous variant.
        // For multi-variant products, send the user to the detail page so they
        // can pick size/color.
        const variants = data.variants ?? [];
        if (variants.length === 1) {
            const variant = variants[0];
            const line: CartLine = {
                ...data,
                variantId: variant.id,
                selectedSize: variant.size,
                selectedColor: variant.color,
                unitPrice: data.price,
            };
            cart.addItem(line);
            return;
        }
        router.push(`/product/${data?.id}`);
    }

    return ( 
        <div onClick={handleClick} className="p-3 space-y-4 bg-white border cursor-pointer group">
            {/* Images and Actions */}
            <div className="relative bg-gray-100 aspect-square">
                <Image
                    fill
                    src={data?.images?.[0]?.url}
                    alt={t('productImageAlt')}
                    className="object-cover aspect-square" />
                {soldOut && (
                    <span className="absolute top-3 left-3 bg-ink px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        {tProduct("soldOut")}
                    </span>
                )}
                <div className="absolute w-full px-6 transition opacity-0 group-hover:opacity-100 bottom-5">
                    <div className="flex justify-center gap-x-6">
                        <IconButton
                            onClick={onPreview}
                            icon={<Expand size={20} className="text-gray-600" />}/>
                        <IconButton
                            onClick={onAddToCart}
                            icon={<ShoppingCart size={20} className="text-gray-600" />}/>
                    </div>
                </div>
            </div>
            {/* Description */}
            <div>
                <p className="text-lg font-semibold">
                    {localizedField(data?.nameI18n, locale, data?.name)}
                </p>
                <p className="text-sm text-gray-500">
                    {localizedField(data?.category?.nameI18n, locale, data?.category?.name)}
                </p>
            </div>
            {/* Price */}
            <div className="flex items-center justify-between">
                <Currency value={data?.price} />
            </div>
        </div>
    );
}

export default ProductCard;