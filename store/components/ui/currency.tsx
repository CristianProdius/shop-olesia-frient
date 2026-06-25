"use client"
import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

const LOCALE_TAGS: Record<string, string> = {
    ro: 'ro-MD',
    ru: 'ru-RU',
};

interface CurrencyProps {
    value?: string | number;
    compareAtValue?: string | number;
    className?: string;
}

const Currency: React.FC<CurrencyProps> = ({ value, compareAtValue, className }) => {
    const [isMounted, setIsMounted] = useState(false);
    const locale = useLocale();

    useEffect(() => {
        setIsMounted(true);
    }, [])

    const formatter = useMemo(() => {
        const localeTag = LOCALE_TAGS[locale] ?? 'en-US';
        return new Intl.NumberFormat(localeTag, {
            style: 'currency',
            currency: 'MDL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }, [locale]);

    if (!isMounted) {
        return null;
    }

    const current = Number(value);
    const compareAt = compareAtValue != null ? Number(compareAtValue) : undefined;
    const isSale = compareAt != null && Number.isFinite(compareAt) && compareAt > current;

    if (isSale) {
        return (
            // span (not div) so it's valid inside inline parents like <p> (e.g. Info)
            <span className={cn("tabular-nums", className)}>
                <span className="price--was tabular-nums line-through">
                    {formatter.format(compareAt as number)}
                </span>
                {' '}
                <span className="price--sale tabular-nums">
                    {formatter.format(current)}
                </span>
            </span>
        );
    }

    return (
        // span (not div) so it's valid inside inline parents like <p> (e.g. Info)
        <span className={cn("text-text tabular-nums", className)}>
            {formatter.format(current)}
        </span>
    );
}

export default Currency;
