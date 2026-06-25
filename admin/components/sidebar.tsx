"use client";

import { Store } from "@prisma/client";
import StoreSwitcher from "@/components/store-switcher";
import { NavGroups, Wordmark } from "@/components/main-nav";

interface SidebarProps {
    stores: Store[];
}

export default function Sidebar({ stores }: SidebarProps) {
    return (
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-muted/40 md:flex">
            <div className="px-4 py-4">
                <Wordmark />
            </div>
            <div className="px-3 pb-3">
                <StoreSwitcher items={stores} className="w-full" />
            </div>
            <NavGroups />
        </aside>
    );
}
