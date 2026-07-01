"use client"

import { Product } from "@/types";
import Image from "next/image";
import Currency from "@/components/ui/currency";
import Stars from "@/components/ui/stars";
import { useRouter } from "@/i18n/navigation";
import usePreviewModal from "@/hooks/use-preview-modal";
import { MouseEventHandler, KeyboardEventHandler } from 'react';
import { useTranslations, useLocale } from "next-intl";
import { localizedField } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

interface ProductCard {
    data: Product;
}

const ProductCard: React.FC<ProductCard> = ({ data }) => {
    const t = useTranslations('Home');
    const locale = useLocale();
    const previewModal = usePreviewModal();
    const router = useRouter();

    const name = localizedField(data?.nameI18n, locale, data?.name);
    const material = localizedField(data?.materialI18n, locale, data?.material ?? "");

    const handleClick = () => {
        router.push(`/product/${data?.id}`)
    }

    const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
        }
    }

    const onPreview: MouseEventHandler<HTMLButtonElement> = (event) => {
        event.stopPropagation();
        previewModal.onOpen(data);
    }

    const baseImage = data?.images?.[0]?.url;
    const hoverImage = data?.images?.[1]?.url;

    return (
        <div
            role="link"
            tabIndex={0}
            aria-label={name}
            onClick={handleClick}
            onKeyDown={onKeyDown}
            className="cursor-pointer group rounded-none"
        >
            {/* Image */}
            <div className="relative w-full overflow-hidden aspect-[3/4] bg-placeholder rounded-none">
                {baseImage && (
                    <Image
                        fill
                        src={baseImage}
                        alt={name}
                        className={cn(
                            "object-cover transition-transform duration-700 ease-out",
                            "group-hover:scale-[1.03]",
                            "motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        )}
                    />
                )}
                {hoverImage && (
                    <Image
                        fill
                        src={hoverImage}
                        alt={name}
                        className={cn(
                            "absolute inset-0 object-cover opacity-0",
                            "transition-opacity duration-500 ease-out group-hover:opacity-100",
                            "motion-reduce:hidden"
                        )}
                    />
                )}
                {/* Quick view */}
                <button
                    type="button"
                    onClick={onPreview}
                    aria-label={`${t('quickView')} — ${name}`}
                    className={cn(
                        "absolute inset-x-0 bottom-0 bg-white/85 py-3 text-center",
                        "text-xs font-bold uppercase tracking-[0.1em] text-ink",
                        "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100",
                        "motion-reduce:transition-none"
                    )}
                >
                    {t('quickView')}
                </button>
            </div>
            {/* Caption */}
            <div className="text-center">
                <p className="product-name mt-[14px]">
                    {name}
                </p>
                {material && (
                    <p className="mt-1 text-xs text-muted-strong">
                        {material}
                    </p>
                )}
                <div className="mt-[6px] flex justify-center">
                    <Currency value={data?.price} />
                </div>
                {data?.ratingCount ? (
                    <div
                        className="mt-2 flex items-center justify-center gap-1.5"
                        aria-label={`${(data.ratingAvg ?? 0).toFixed(1)} / 5 (${data.ratingCount})`}
                    >
                        <Stars value={data.ratingAvg ?? 0} className="text-[13px]" />
                        <span className="text-xs text-muted-strong tabular-nums">
                            ({data.ratingCount})
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default ProductCard;
