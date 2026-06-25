"use client"

import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    LayoutDashboard,
    Package,
    FolderTree,
    Ruler,
    Palette,
    Image as ImageIcon,
    Newspaper,
    ShoppingCart,
    Mail,
    Settings,
    Star,
    Scissors,
    BellRing,
    FileText,
    HelpCircle,
    BarChart3,
    type LucideIcon,
} from "lucide-react";

export type NavGroup = {
    label: string;
    items: NavItem[];
};

export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
};

/**
 * Shared grouped-nav builder consumed by the desktop Sidebar and the mobile
 * drawer. Builds hrefs from params.storeId and active state from pathname,
 * mirroring the original MainNav logic.
 */
export function useNavGroups(): { groups: NavGroup[]; settings: NavItem } {
    const pathname = usePathname();
    const params = useParams();
    const t = useTranslations('Nav');

    const base = `/${params.storeId}`;
    const isActive = (href: string) => pathname === href;

    const item = (segment: string, label: string, icon: LucideIcon): NavItem => {
        const href = segment ? `${base}/${segment}` : base;
        return { href, label, icon, active: isActive(href) };
    };

    const groups: NavGroup[] = [
        {
            label: t('groupStore'),
            items: [item('', t('overview'), LayoutDashboard)],
        },
        {
            label: t('groupCatalog'),
            items: [
                item('products', t('products'), Package),
                item('categories', t('categories'), FolderTree),
                item('sizes', t('sizes'), Ruler),
                item('colors', t('colors'), Palette),
            ],
        },
        {
            label: t('groupSales'),
            items: [
                item('orders', t('orders'), ShoppingCart),
                item('custom-orders', t('customOrders'), Scissors),
                item('stock-notifications', t('stockNotifications'), BellRing),
                item('reviews', t('reviews'), Star),
            ],
        },
        {
            label: t('groupContent'),
            items: [
                item('billboards', t('billboards'), ImageIcon),
                item('blog', t('blog'), Newspaper),
                item('content', t('content'), FileText),
                item('faqs', t('faqs'), HelpCircle),
            ],
        },
        {
            label: t('groupMarketing'),
            items: [
                item('subscribers', t('subscribers'), Mail),
                item('stats', t('stats'), BarChart3),
            ],
        },
    ];

    const settings = item('settings', t('settings'), Settings);

    return { groups, settings };
}

/**
 * Shared nav-link renderer. Idle vs active styling with a left accent bar on
 * the active item. Used by both the sidebar and the mobile drawer.
 */
export function NavLink({
    item,
    onNavigate,
}: {
    item: NavItem;
    onNavigate?: () => void;
}) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={item.active ? "page" : undefined}
            className={cn(
                "relative flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors",
                item.active
                    ? "bg-secondary text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
        </Link>
    );
}

/**
 * Renders the grouped nav body (groups + pinned Settings). Shared between the
 * desktop sidebar and the mobile drawer.
 */
export function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
    const { groups, settings } = useNavGroups();
    return (
        <>
            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-2">
                {groups.map((group, gi) => (
                    <div key={gi} className="flex flex-col gap-1">
                        <span className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                            {group.label}
                        </span>
                        {group.items.map((navItem) => (
                            <NavLink key={navItem.href} item={navItem} onNavigate={onNavigate} />
                        ))}
                    </div>
                ))}
            </nav>
            <div className="mt-auto border-t px-2 py-2">
                <NavLink item={settings} onNavigate={onNavigate} />
            </div>
        </>
    );
}

/**
 * Two-line stacked minimal-luxury wordmark.
 */
export function Wordmark({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center leading-none", className)}>
            <span className="text-[15px] font-bold uppercase tracking-[0.25em] text-foreground">
                Liletti
            </span>
        </div>
    );
}

/**
 * Backwards-compatible named export. The topbar no longer uses this, but it is
 * kept resolvable for any remaining importers. Renders the grouped nav inline.
 */
export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    const { groups } = useNavGroups();
    return (
        <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
            {groups.flatMap((group) =>
                group.items.map((navItem) => (
                    <Link
                        key={navItem.href}
                        href={navItem.href}
                        className={cn(
                            "text-sm font-medium transition-colors hover:text-primary",
                            navItem.active ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {navItem.label}
                    </Link>
                ))
            )}
        </nav>
    );
}
