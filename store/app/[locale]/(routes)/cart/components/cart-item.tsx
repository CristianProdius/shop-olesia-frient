"use client"
import { cn } from '@/lib/utils';
import Currency from '@/components/ui/currency';
import useCart, { CartLine } from '@/hooks/use-cart';
import { Minus, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { localizedField } from '@/lib/i18n-content';

interface CartItemProps {
    data: CartLine;
}

const CartItem: React.FC<CartItemProps> = ({ data }) => {

    const cart = useCart();
    const locale = useLocale();
    const t = useTranslations('Cart');

    // Back-compat: lines from an older persisted cart may lack variantId.
    const lineId = data.variantId ?? data.id;
    // Prefer the variant-scoped labels; fall back to the product's scalar size/color.
    const color = data.selectedColor ?? data.color;
    const size = data.selectedSize ?? data.size;

    const quantity = data.quantity ?? 1;
    const lineSubtotal = Number(data.unitPrice ?? data.price) * quantity;

    const onRemove = () => {
        cart.removeItem(lineId);
    }

    return (
        <li className='flex py-6 border-b border-border'>
            <div className='relative w-24 aspect-[3/4] shrink-0 overflow-hidden rounded-none bg-placeholder'>
                <Image
                    fill
                    src={data.images[0].url}
                    alt={localizedField(data.nameI18n, locale, data.name)}
                    className='object-cover object-center'
                />
            </div>
            <div className='relative flex flex-col justify-between flex-1 ml-4 sm:ml-6'>
                <button
                    type='button'
                    onClick={onRemove}
                    aria-label={t('remove')}
                    className={cn('absolute top-0 right-0 z-10 flex items-center justify-center w-10 h-10 rounded-none bg-transparent border-0 shadow-none text-text hover:text-muted transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2')}>
                    <X size={15} />
                </button>
                <div className='relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0'>
                    <div className='flex justify-between'>
                        <p className='product-name text-left text-text'>
                            {localizedField(data.nameI18n, locale, data.name)}
                        </p>
                    </div>
                    <div className='flex mt-1 text-xs text-muted-strong'>
                        {color && (
                            <p>{localizedField(color.nameI18n, locale, color.name)}</p>
                        )}
                        {size && (
                            <p className='pl-4 ml-4 border-l border-border'>{localizedField(size.nameI18n, locale, size.name)}</p>
                        )}
                    </div>
                    {data.sku && (
                        <p className='mt-1 text-xs text-muted-strong'>
                            {t('code')}: {data.sku}
                        </p>
                    )}
                    <Currency value={data.unitPrice ?? data.price} />
                </div>
                <div className='flex items-center justify-between gap-2 mt-4'>
                    <div className='inline-flex items-center border border-border'>
                        <button
                            type='button'
                            onClick={() => cart.updateQuantity(lineId, quantity - 1)}
                            disabled={quantity <= 1}
                            aria-label={t('decreaseQuantity')}
                            className='flex items-center justify-center w-9 h-9 text-text transition-colors duration-200 ease-out hover:text-muted disabled:opacity-40 disabled:hover:text-text'>
                            <Minus size={14} strokeWidth={1.5} />
                        </button>
                        <span className='min-w-8 text-center text-sm tabular-nums text-text'>
                            {quantity}
                        </span>
                        <button
                            type='button'
                            onClick={() => cart.updateQuantity(lineId, quantity + 1)}
                            aria-label={t('increaseQuantity')}
                            className='flex items-center justify-center w-9 h-9 text-text transition-colors duration-200 ease-out hover:text-muted'>
                            <Plus size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                    <Currency value={lineSubtotal} className='text-text' />
                </div>
            </div>
        </li>
    )
}

export default CartItem;