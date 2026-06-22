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
import useCart from "@/hooks/use-cart";
import { useTranslations, useLocale } from "next-intl";
import { localizedField } from "@/lib/i18n-content";

interface ProductCard {
    data: Product;
}

const ProductCard: React.FC<ProductCard> = ({ data }) => {
    const t = useTranslations('Home');
    const locale = useLocale();
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
        cart.addItem(data);
    }

    return ( 
        <div onClick={handleClick} className="p-3 space-y-4 bg-white border cursor-pointer group rounded-xl">
            {/* Images and Actions */}
            <div className="relative bg-gray-100 aspect-square rounded-xl">
                <Image
                    fill
                    src={data?.images?.[0]?.url}
                    alt={t('productImageAlt')}
                    className="object-cover rounded-md aspect-square" />
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