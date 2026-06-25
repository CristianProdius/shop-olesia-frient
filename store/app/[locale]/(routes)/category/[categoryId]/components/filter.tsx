"use client";

import { cn } from '@/lib/utils';
import { Color, Size } from '@/types';
import qs from 'query-string'
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { localizedField } from '@/lib/i18n-content';

interface FilterProps {
    data: (Size | Color) [];
    name: string;
    valueKey: string;
    locale: string;
}

const Filter: React.FC<FilterProps> = ({ data, name, valueKey, locale }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const selectedValue = searchParams.get(valueKey);

    const onClick = (id: string) => {
        const current = qs.parse(searchParams.toString());
        const query = { ...current, [valueKey]: id }

        if(current[valueKey] === id) {
            query[valueKey] = null;
        }

        const url = qs.stringifyUrl({
            url: window.location.href,
            query
        }, { skipNull: true })

        router.push(url);
    }
    return (
        <div className='mb-8'>
            <h3 className='text-[13px] font-bold uppercase tracking-[0.12em] text-text'>{name}</h3>
            <hr className='rule my-4' />
            <div className='flex flex-wrap gap-2'>
                {data.map(filter => {
                    const isSelected = selectedValue === filter.id;
                    return (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => onClick(filter.id)}
                            aria-pressed={isSelected}
                            className={cn(
                                "border border-border rounded-none px-3 py-1.5 text-xs uppercase tracking-[0.06em] transition-colors duration-200 ease-out",
                                isSelected
                                    ? "border-border-strong text-ink bg-transparent"
                                    : "text-muted-strong hover:text-ink"
                            )}
                        >
                            {localizedField(filter.nameI18n, locale, filter.name)}
                        </button>
                    );
                })}
            </div>
        </div>
    )
}

export default Filter;
