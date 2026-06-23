"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Globe, Factory, RefreshCcw } from "lucide-react";

const BADGES = [
    { key: "payment", Icon: ShieldCheck },
    { key: "delivery", Icon: Globe },
    { key: "ownProduction", Icon: Factory },
    { key: "returns", Icon: RefreshCcw },
] as const;

// Compact horizontal trust-signal row for cart / checkout. Reassures shoppers
// near the summary / pay action. Radius-0, token utilities only.
const TrustBadges = () => {
    const t = useTranslations("TrustBadges");

    return (
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {BADGES.map(({ key, Icon }) => (
                <li
                    key={key}
                    className="flex items-center gap-x-2 text-xs text-muted-strong"
                >
                    <Icon
                        className="h-4 w-4 text-ink"
                        strokeWidth={1.25}
                        aria-hidden="true"
                    />
                    <span>{t(key)}</span>
                </li>
            ))}
        </ul>
    );
};

export default TrustBadges;
