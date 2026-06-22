"use client"
import Currency from '@/components/ui/currency';
import IconButton from '@/components/ui/icon-button';
import useCart from '@/hooks/use-cart';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Product } from '@/types';
import { localizedField } from '@/lib/i18n-content';

interface CartItemProps {
    data: Product;
}

const CartItem: React.FC<CartItemProps> = ({ data }) => {

    const cart = useCart();
    const locale = useLocale();

    const onRemove = () => {
        cart.removeItem(data.id);
    }

    return (
        <li className='flex py-6 border-b'>
            <div className='relative w-24 h-24 overflow-hidden rounded-md sm:h-48 sm:w-48'>
                <Image
                    fill
                    src={data.images[0].url}
                    alt=""
                    className='object-cover object-center'
                />
            </div>
            <div className='relative flex flex-col justify-between flex-1 ml-4 sm:ml-6'>
                <div className='absolute top-0 right-0 z-10'>
                    <IconButton onClick={onRemove} icon={<X size={15} />} />
                </div>
                <div className='relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0'>
                    <div className='flex justify-between'>
                        <p className='text-lg font-semibold text-black'>
                            {localizedField(data.nameI18n, locale, data.name)}
                        </p>
                    </div>
                    <div className='flex mt-1 text-sm'>
                        <p className='text-gray-500'>{localizedField(data.color.nameI18n, locale, data.color.name)}</p>
                        <p className='pl-4 ml-4 text-gray-500 border-l border-gray-200'>{localizedField(data.size.nameI18n, locale, data.size.name)}</p>
                    </div>
                    <Currency value={data.price} />
                </div>
            </div>
        </li>
    )
}

export default CartItem;