"use client"

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = {
    en: "EN",
    ru: "RU",
    ro: "RO",
};

const LanguageSwitcher = () => {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(() => {
            // Keep the current path, swap the locale prefix.
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <select
            aria-label="Language"
            value={locale}
            onChange={onChange}
            disabled={isPending}
            className="px-2 py-1 text-sm bg-transparent border rounded-md cursor-pointer"
        >
            {routing.locales.map((loc) => (
                <option key={loc} value={loc}>
                    {LABELS[loc] ?? loc.toUpperCase()}
                </option>
            ))}
        </select>
    );
};

export default LanguageSwitcher;
