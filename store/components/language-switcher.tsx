"use client"

import { Menu, Transition } from "@headlessui/react";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
    en: "EN",
    ru: "RU",
    ro: "RO",
};

const LanguageSwitcher = () => {
    const locale = useLocale();
    const t = useTranslations("Navbar");
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const switchLocale = (nextLocale: string) => {
        startTransition(() => {
            // Keep the current path, swap the locale prefix.
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <Menu as="div" className="relative">
            <Menu.Button
                aria-label={t("language")}
                disabled={isPending}
                className="flex items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong disabled:opacity-60"
            >
                <Globe size={20} strokeWidth={1.5} />
            </Menu.Button>
            <Transition
                as={Fragment}
                enter="transition duration-200 ease-out motion-reduce:transition-none"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-150 ease-out motion-reduce:transition-none"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <Menu.Items className="absolute right-0 z-60 mt-2 min-w-[120px] origin-top-right border border-border bg-background py-1 shadow-[var(--shadow-overlay)] rounded-none focus:outline-none">
                    {routing.locales.map((loc) => {
                        const isActive = loc === locale;
                        return (
                            <Menu.Item key={loc}>
                                {({ active }) => (
                                    <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => switchLocale(loc)}
                                        className={cn(
                                            "flex w-full items-center px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 ease-out disabled:opacity-60",
                                            active && "bg-surface",
                                            isActive
                                                ? "font-bold text-ink"
                                                : "text-muted",
                                        )}
                                    >
                                        {LABELS[loc] ?? loc.toUpperCase()}
                                    </button>
                                )}
                            </Menu.Item>
                        );
                    })}
                </Menu.Items>
            </Transition>
        </Menu>
    );
};

export default LanguageSwitcher;
