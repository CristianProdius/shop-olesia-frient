"use client"
import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl';
import { localizedField } from '@/lib/i18n-content';

interface MainNavProps {
    data: Category[] | []
}

const MainNav: React.FC<MainNavProps> = ({ data }) => {
    const pathname = usePathname();
    const locale = useLocale();

    const routes = data.map(route => ({
        href: `/category/${route.id}`,
        label: localizedField(route.nameI18n, locale, route.name),
        active: pathname === `/category/${route.id}`
    }))

    return (
        <nav className='flex items-center mx-6 space-x-4 lg:space-x-6'>
            {routes.map(route => (
                <Link key={route.href} href={route.href} className={cn('text-sm font-medium transition-colors hover:text-black', route.active ? 'text-black' : 'text-neutral-500')}>
                    {route.label}
                </Link>
            ))}
        </nav>
    )
}

export default MainNav;