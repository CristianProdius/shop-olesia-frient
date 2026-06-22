"use client"

import { useLocale, useTranslations } from "next-intl";
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
    const t = useTranslations("Nav");
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <select
            aria-label={t("language")}
            value={locale}
            onChange={onChange}
            disabled={isPending}
            className="h-9 px-2 text-sm bg-transparent border rounded-md cursor-pointer border-input"
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
