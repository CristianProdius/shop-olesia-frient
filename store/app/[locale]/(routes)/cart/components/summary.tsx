"use client"

import Button from '@/components/ui/button';
import Currency from '@/components/ui/currency';
import useCart from '@/hooks/use-cart';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import TrustBadges from '@/components/trust-badges';

const Summary = () => {
    const t = useTranslations('Cart');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const items = useCart(state => state.items);
    const removeAll = useCart(state => state.removeAll);
    const totalPrice = items.reduce((total, item) => total + Number(item.price), 0)

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
        // Login required to checkout. Send guests to sign in, then on to the
        // simulated checkout form (which finalizes the order via the admin API).
        if (!session) {
            router.push("/sign-in?redirect=/checkout");
            return;
        }

        router.push("/checkout");
    }

    return ( 
        <div className='px-4 py-6 mt-16 bg-gray-50 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8'>
            <h2 className='text-lg font-medium text-gray-900'>{t("orderSummary")}</h2>
            <div className='mt-6 space-y-4'>
                <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                    <div className='text-base font-medium text-gray-400'>
                        {t("orderTotal")}
                    </div>
                    <Currency value={totalPrice} />
                </div>
            </div>
            <Button disabled={items.length === 0} className='w-full mt-6' onClick={onCheckout}>
                {t("checkout")}
            </Button>
            <div className='pt-6 mt-6 border-t border-border'>
                <TrustBadges />
            </div>
        </div>
     );
}
 
export default Summary;