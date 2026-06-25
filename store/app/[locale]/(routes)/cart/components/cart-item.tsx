"use client"
import { cn } from '@/lib/utils';
import Currency from '@/components/ui/currency';
import useCart from '@/hooks/use-cart';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Product } from '@/types';
import { localizedField } from '@/lib/i18n-content';

interface CartItemProps {
    data: Product;
}

const CartItem: React.FC<CartItemProps> = ({ data }) => {

    const cart = useCart();
    const locale = useLocale();
    const t = useTranslations('Cart');

    const onRemove = () => {
        cart.removeItem(data.id);
    }

    return (
        <li className='flex py-6 border-b border-border'>
            <div className='relative w-24 aspect-[3/4] shrink-0 overflow-hidden rounded-none bg-placeholder'>
                <Image
                    fill
                    src={data.images[0].url}
                    alt=""
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
                        <p>{localizedField(data.color.nameI18n, locale, data.color.name)}</p>
                        <p className='pl-4 ml-4 border-l border-border'>{localizedField(data.size.nameI18n, locale, data.size.name)}</p>
                    </div>
                    {data.sku && (
                        <p className='mt-1 text-xs text-muted-strong'>
                            {t('code')}: {data.sku}
                        </p>
                    )}
                    <Currency value={data.price} />
                </div>
            </div>
        </li>
    )
}

export default CartItem;