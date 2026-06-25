"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Store } from "@prisma/client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import StoreSwitcher from "@/components/store-switcher";
import { NavGroups, Wordmark } from "@/components/main-nav";

interface MobileNavProps {
    stores: Store[];
}

export default function MobileNav({ stores }: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const t = useTranslations("Nav");

    return (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger
                aria-label={t("openMenu")}
                className={cn(
                    "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
                )}
            >
                <Menu className="size-5" />
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    aria-label={t("menu")}
                    className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
                >
                    <div className="flex items-center justify-between px-4 py-4">
                        <Wordmark />
                        <DialogPrimitive.Close
                            aria-label={t("closeMenu")}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <X className="size-4" />
                        </DialogPrimitive.Close>
                    </div>
                    <div className="px-3 pb-3">
                        <StoreSwitcher items={stores} className="w-full" />
                    </div>
                    <NavGroups onNavigate={() => setOpen(false)} />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
