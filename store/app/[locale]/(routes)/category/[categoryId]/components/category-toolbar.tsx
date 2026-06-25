"use client";

import { Listbox } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type SortKey =
    | "newest"
    | "oldest"
    | "priceLow"
    | "priceHigh"
    | "nameAsc";

export const SORT_KEYS: SortKey[] = [
    "newest",
    "oldest",
    "priceLow",
    "priceHigh",
    "nameAsc",
];

const SORT_LABEL_KEYS: Record<SortKey, string> = {
    newest: "sortNewest",
    oldest: "sortOldest",
    priceLow: "sortPriceLow",
    priceHigh: "sortPriceHigh",
    nameAsc: "sortNameAsc",
};

const DENSITIES = [1, 2, 3, 4] as const;

interface CategoryToolbarProps {
    sort: SortKey;
    onSortChange: (sort: SortKey) => void;
    density: number;
    onDensityChange: (density: number) => void;
}

const DensityIcon = ({ columns }: { columns: number }) => (
    <span
        aria-hidden
        className="grid h-3.5 w-3.5 gap-px"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
        {Array.from({ length: columns }).map((_, i) => (
            <span key={i} className="bg-current" />
        ))}
    </span>
);

const CategoryToolbar: React.FC<CategoryToolbarProps> = ({
    sort,
    onSortChange,
    density,
    onDensityChange,
}) => {
    const t = useTranslations("CategoryPage");

    return (
        <div className="my-6 flex items-end justify-between gap-4">
            {/* VIEW AS density toggle */}
            <div>
                <span className="eyebrow block text-muted-strong">{t("viewAs")}</span>
                {/* Desktop: 1/2/3/4 */}
                <div className="mt-2 hidden items-center gap-2 lg:flex">
                    {DENSITIES.map((columns) => {
                        const isActive = density === columns;
                        return (
                            <button
                                key={columns}
                                type="button"
                                onClick={() => onDensityChange(columns)}
                                aria-pressed={isActive}
                                aria-label={`${columns}`}
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center border transition-colors duration-200 ease-out",
                                    isActive
                                        ? "border-border-strong text-ink"
                                        : "border-transparent text-muted-strong hover:text-ink"
                                )}
                            >
                                <DensityIcon columns={columns} />
                            </button>
                        );
                    })}
                </div>
                {/* Mobile: 1/2 */}
                <div className="mt-2 flex items-center gap-2 lg:hidden">
                    {[1, 2].map((columns) => {
                        const isActive = density === columns;
                        return (
                            <button
                                key={columns}
                                type="button"
                                onClick={() => onDensityChange(columns)}
                                aria-pressed={isActive}
                                aria-label={`${columns}`}
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center border transition-colors duration-200 ease-out",
                                    isActive
                                        ? "border-border-strong text-ink"
                                        : "border-transparent text-muted-strong hover:text-ink"
                                )}
                            >
                                <DensityIcon columns={columns} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* SORT BY */}
            <div className="flex flex-col items-end">
                <span className="eyebrow block text-muted-strong">{t("sortBy")}</span>
                <Listbox value={sort} onChange={onSortChange}>
                    <div className="relative mt-2 w-[150px]">
                        <Listbox.Button className="flex h-11 w-full items-center justify-between border border-border rounded-none bg-background px-3 text-left text-xs uppercase tracking-[0.06em] text-text focus:border-border-strong focus:outline-none">
                            <span className="truncate">{t(SORT_LABEL_KEYS[sort])}</span>
                            <ChevronDown size={14} aria-hidden className="ml-2 shrink-0" />
                        </Listbox.Button>
                        <Listbox.Options className="absolute right-0 z-30 mt-1 w-full min-w-[150px] border border-border rounded-none bg-background py-1 shadow-[var(--shadow-overlay)] focus:outline-none">
                            {SORT_KEYS.map((key) => (
                                <Listbox.Option
                                    key={key}
                                    value={key}
                                    className={({ active }) =>
                                        cn(
                                            "flex cursor-pointer items-center justify-between px-3 py-2 text-xs uppercase tracking-[0.06em]",
                                            active ? "text-ink" : "text-muted-strong"
                                        )
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <span
                                                className={cn(
                                                    "truncate",
                                                    selected && "text-ink"
                                                )}
                                            >
                                                {t(SORT_LABEL_KEYS[key])}
                                            </span>
                                            {selected && (
                                                <Check
                                                    size={14}
                                                    aria-hidden
                                                    className="ml-2 shrink-0 text-ink"
                                                />
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </div>
                </Listbox>
            </div>
        </div>
    );
};

export default CategoryToolbar;
