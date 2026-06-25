"use client"

import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function MainNav({ className, ...props } : React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();
    const params = useParams();
    const t = useTranslations('Nav');

    const routes = [{
        href: `/${params.storeId}`,
        label: t('overview'),
        active: pathname === `/${params.storeId}`
    }, {
        href: `/${params.storeId}/billboards`,
        label: t('billboards'),
        active: pathname === `/${params.storeId}/billboards`
    }, {
        href: `/${params.storeId}/categories`,
        label: t('categories'),
        active: pathname === `/${params.storeId}/categories`
    }, {
        href: `/${params.storeId}/sizes`,
        label: t('sizes'),
        active: pathname === `/${params.storeId}/sizes`
    }, {
        href: `/${params.storeId}/colors`,
        label: t('colors'),
        active: pathname === `/${params.storeId}/colors`
    }, {
        href: `/${params.storeId}/products`,
        label: t('products'),
        active: pathname === `/${params.storeId}/products`
    }, {
        href: `/${params.storeId}/blog`,
        label: t('blog'),
        active: pathname === `/${params.storeId}/blog`
    }, {
        href: `/${params.storeId}/content`,
        label: t('content'),
        active: pathname === `/${params.storeId}/content`
    }, {
        href: `/${params.storeId}/faqs`,
        label: t('faqs'),
        active: pathname === `/${params.storeId}/faqs`
    }, {
        href: `/${params.storeId}/stats`,
        label: t('stats'),
        active: pathname === `/${params.storeId}/stats`
    }, {
        href: `/${params.storeId}/reviews`,
        label: t('reviews'),
        active: pathname === `/${params.storeId}/reviews`
    }, {
        href: `/${params.storeId}/orders`,
        label: t('orders'),
        active: pathname === `/${params.storeId}/orders`
    }, {
        href: `/${params.storeId}/subscribers`,
        label: t('subscribers'),
        active: pathname === `/${params.storeId}/subscribers`
    }, {
        href: `/${params.storeId}/stock-notifications`,
        label: t('stockNotifications'),
        active: pathname === `/${params.storeId}/stock-notifications`
    }, {
        href: `/${params.storeId}/custom-orders`,
        label: t('customOrders'),
        active: pathname === `/${params.storeId}/custom-orders`
    }, {
        href: `/${params.storeId}/settings`,
        label: t('settings'),
        active: pathname === `/${params.storeId}/settings`
    }];
    return (
        <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
           {routes.map((route, index) => (
            <Link key={index} href={route.href} className={cn("text-sm font-medium transition-colors hover:text-primary", route.active ? "text-black dark:text-white" : "text-muted-foreground")}>
                {route.label}
            </Link>
           ))} 
        </nav>
    )
}