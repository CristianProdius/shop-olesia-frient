"use client"
import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl';
import { localizedField } from '@/lib/i18n-content';

interface MainNavProps {
    data: Category[] | []
}

const MainNav: React.FC<MainNavProps> = ({ data }) => {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('Navbar');

    const routes = data.map(route => ({
        href: `/category/${route.id}`,
        label: localizedField(route.nameI18n, locale, route.name),
        active: pathname === `/category/${route.id}`
    }))

    return (
        <nav className='flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:gap-x-8'>
            {routes.map(route => (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        'relative whitespace-nowrap text-[13px] font-bold uppercase tracking-[1px] leading-none transition-colors duration-200 ease-out',
                        'after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:h-px after:w-0 after:bg-ink after:transition-[width] after:duration-300 after:ease-out hover:after:w-full',
                        route.active ? 'text-ink after:w-full' : 'text-text hover:text-ink'
                    )}
                >
                    {route.label}
                </Link>
            ))}
            <Link
                href="/blog"
                className={cn(
                    'relative whitespace-nowrap text-[13px] font-bold uppercase tracking-[1px] leading-none transition-colors duration-200 ease-out',
                    'after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:h-px after:w-0 after:bg-ink after:transition-[width] after:duration-300 after:ease-out hover:after:w-full',
                    pathname.startsWith('/blog') ? 'text-ink after:w-full' : 'text-text hover:text-ink'
                )}
            >
                {t('journal')}
            </Link>
        </nav>
    )
}

export default MainNav;