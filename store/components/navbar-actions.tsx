"use client"
import useCart from '@/hooks/use-cart';
import useCartDrawer from '@/hooks/use-cart-drawer';
import { cn } from '@/lib/utils';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import LanguageSwitcher from '@/components/language-switcher';
import SearchDialog from '@/components/search-dialog';
import { useTranslations } from 'next-intl';

const NavbarActions = () => {
    const [isMounted, setIsMounted] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    useEffect(() => {
        setIsMounted(true);
    }, [])

    const cart = useCart();
    const cartDrawer = useCartDrawer();
    const router = useRouter();
    const { data: session } = useSession();
    const t = useTranslations('Navbar');

    // Bump the badge only when the count increases (not on load / removal).
    const count = cart?.items?.length ?? 0;
    const prevCount = useRef(count);
    const [bumpKey, setBumpKey] = useState(0);
    useEffect(() => {
        if (count > prevCount.current) setBumpKey((k) => k + 1);
        prevCount.current = count;
    }, [count]);

    if(!isMounted) {
        return null;
    }

    const onAccount = async () => {
        if (session) {
            await signOut();
            router.refresh();
        } else {
            router.push('/sign-in');
        }
    };

    const iconButtonClass =
        'rounded-none text-text transition-colors duration-200 hover:text-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-border-strong motion-reduce:transition-none';

    return (
        <div className="ml-auto flex items-center gap-[22px]">
            <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={t('search')}
                className={iconButtonClass}
            >
                <Search className="h-[22px] w-[22px] stroke-[1.5]" />
            </button>

            <button
                type="button"
                onClick={onAccount}
                aria-label={t('account')}
                title={
                    session
                        ? t('signOutWithEmail', { email: session.user?.email ?? '' })
                        : undefined
                }
                className={iconButtonClass}
            >
                <User className="h-[22px] w-[22px] stroke-[1.5]" />
            </button>

            <div className="relative">
                <button
                    type="button"
                    onClick={cartDrawer.onOpen}
                    aria-label={t('cart')}
                    className={iconButtonClass}
                >
                    <ShoppingBag className="h-[22px] w-[22px] stroke-[1.5]" />
                </button>
                <span
                    key={bumpKey}
                    className={cn(
                        "absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-badge px-1 text-[10px] font-semibold text-ink",
                        bumpKey > 0 && "animate-cart-bump"
                    )}
                >
                    {count}
                </span>
            </div>

            <LanguageSwitcher />

            <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
    )
}

export default NavbarActions;
