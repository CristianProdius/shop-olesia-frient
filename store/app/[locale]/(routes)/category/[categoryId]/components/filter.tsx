"use client";

import Button from '@/components/ui/button';
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
            <h3 className='text-lg font-semibold'>{name}</h3>
            <hr className='my-4' />
            <div className='flex flex-wrap gap-2'>
                {data.map(filter => (
                    <div key={filter.id} className='flex items-center'>
                        <Button className={cn("text-sm text-gray-800 p-2 bg-white border border-gray-300", selectedValue === filter.id && "bg-black text-white")}
                        onClick={() => onClick(filter.id)}>
                            {localizedField(filter.nameI18n, locale, filter.name)}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Filter;