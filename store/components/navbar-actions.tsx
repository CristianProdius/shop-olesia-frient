"use client"
import Button from '@/components/ui/button';
import useCart from '@/hooks/use-cart';
import { LogOut, ShoppingBag, User } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import LanguageSwitcher from '@/components/language-switcher';
import { useTranslations } from 'next-intl';

const NavbarActions = () => {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true);
    }, [])

    const cart = useCart();
    const router = useRouter();
    const { data: session } = useSession();
    const t = useTranslations('Navbar');

    if(!isMounted) {
        return null;
    }

    const onSignOut = async () => {
        await signOut();
        router.refresh();
    };

    return (
        <div className="flex items-center ml-auto gap-x-4">
            <LanguageSwitcher />
            {session ? (
                <>
                    <Button
                        className='flex items-center px-3 py-2 bg-black rounded-full'
                        onClick={() => router.push('/account')}
                        title={t('account')}
                    >
                        <User size={18} color='white' />
                    </Button>
                    <Button
                        className='flex items-center px-3 py-2 bg-black rounded-full'
                        onClick={onSignOut}
                        title={t('signOutWithEmail', { email: session.user?.email ?? '' })}
                    >
                        <LogOut size={18} color='white' />
                    </Button>
                </>
            ) : (
                <Button
                    className='flex items-center px-3 py-2 bg-black rounded-full'
                    onClick={() => router.push('/sign-in')}
                    title={t('signIn')}
                >
                    <User size={18} color='white' />
                </Button>
            )}
            <Button className='flex items-center px-4 py-2 bg-black rounded-full'
                onClick={() => router.push("/cart")}>
                <ShoppingBag size={20} color='white' />
                <span className='flex items-center justify-center ml-2 min-w-5 h-5 px-1.5 text-xs font-medium text-ink bg-badge rounded-full'>
                    {cart?.items?.length}
                </span>
            </Button>
        </div>
    )
}

export default NavbarActions;
