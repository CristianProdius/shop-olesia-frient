"use client"
import Button from '@/components/ui/button';
import useCart from '@/hooks/use-cart';
import { LogOut, ShoppingBag, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import LanguageSwitcher from '@/components/language-switcher';

const NavbarActions = () => {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true);
    }, [])

    const cart = useCart();
    const router = useRouter();
    const { data: session } = useSession();

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
                <Button
                    className='flex items-center px-3 py-2 bg-black rounded-full'
                    onClick={onSignOut}
                    title={`Sign out (${session.user?.email ?? ''})`}
                >
                    <LogOut size={18} color='white' />
                </Button>
            ) : (
                <Button
                    className='flex items-center px-3 py-2 bg-black rounded-full'
                    onClick={() => router.push('/sign-in')}
                    title='Sign in'
                >
                    <User size={18} color='white' />
                </Button>
            )}
            <Button className='flex items-center px-4 py-2 bg-black rounded-full'
                onClick={() => router.push("/cart")}>
                <ShoppingBag size={20} color='white' />
                <span className='ml-2 text-sm font-medium text-white'>
                    {cart?.items?.length}
                </span>
            </Button>
        </div>
    )
}

export default NavbarActions;
