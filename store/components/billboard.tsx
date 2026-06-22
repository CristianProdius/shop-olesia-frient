import { Billboard as BillboardType } from '@/types';
import { getLocale } from 'next-intl/server';
import { localizedField } from '@/lib/i18n-content';

interface BillboardProps {
    data: BillboardType
};

const Billboard = async ({ data }: BillboardProps) => {
    const locale = await getLocale();
    return (
        <div className='p-4 overflow-hidden sm:p-6 lg:p-8 rounded-xl'>
            <div
                className='rounded-xl relative aspect-square md:aspect-[2.4/1] overflow-hidden'
                style={{ backgroundImage: `url(${data?.imageUrl})` }}>
                    <div className='flex flex-col items-center justify-center w-full h-full text-center gap-y-8'>
                        <div className='max-w-xs text-3xl font-bold sm:text-5xl lg:text-6xl sm:max-w-xl'>
                            {localizedField(data?.labelI18n, locale, data?.label)}
                        </div>
                    </div>
                </div>
        </div>
    );
}

export default Billboard;