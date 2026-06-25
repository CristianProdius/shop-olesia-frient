"use client"

import Button from '@/components/ui/button';
import Currency from '@/components/ui/currency';
import useCart from '@/hooks/use-cart';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import TrustBadges from '@/components/trust-badges';

const Summary = () => {
    const t = useTranslations('Cart');
    const router = useRouter();
    const searchParams = useSearchParams();
    const items = useCart(state => state.items);
    const removeAll = useCart(state => state.removeAll);
    const totalPrice = items.reduce((total, item) => total + Number(item.unitPrice ?? item.price), 0)

    useEffect(() => {
        if(searchParams.get('success')) {
            toast.success(t("paymentCompleted"));
            removeAll();
        }
        if(searchParams.get("canceled")) {
            toast.error(t("somethingWentWrong"))
        }
    }, [searchParams, removeAll, t])

    const onCheckout = () => {
        // Guest checkout — no login required.
        router.push("/checkout");
    }

    return (
        <div className='mt-16 rounded-none bg-surface-2 p-6 lg:col-span-5 lg:mt-0'>
            <h2 className='text-sm font-bold uppercase tracking-[0.1em] text-ink'>{t("orderSummary")}</h2>
            <div className='mt-6 space-y-4'>
                <div className='flex items-center justify-between pt-4 border-t border-border'>
                    <div className='text-base font-bold uppercase tracking-[0.1em] text-ink'>
                        {t("orderTotal")}
                    </div>
                    <Currency value={totalPrice} />
                </div>
            </div>
            <Button variant='primary' size='lg' disabled={items.length === 0} className='w-full mt-6' onClick={onCheckout}>
                {t("checkout")}
            </Button>
            <div className='pt-6 mt-6 border-t border-border'>
                <TrustBadges />
            </div>
        </div>
     );
}
 
export default Summary;