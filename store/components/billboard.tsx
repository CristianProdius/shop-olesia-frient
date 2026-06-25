import Image from 'next/image';
import { Billboard as BillboardType } from '@/types';
import { getLocale } from 'next-intl/server';
import { localizedField } from '@/lib/i18n-content';
import { Link } from '@/i18n/navigation';

interface BillboardProps {
    data: BillboardType;
    ctaHref?: string;
    ctaLabel?: string;
}

const Billboard = async ({ data, ctaHref, ctaLabel }: BillboardProps) => {
    const locale = await getLocale();
    const label = localizedField(data?.labelI18n, locale, data?.label);
    return (
        <div className='relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden min-h-[60vh] md:h-[clamp(520px,88vh,900px)] bg-placeholder'>
            {data?.imageUrl && (
                <Image
                    src={data.imageUrl}
                    alt={label ?? ''}
                    fill
                    priority
                    sizes='100vw'
                    className='object-cover'
                />
            )}
            {/* Subtle scrim for on-dark legibility */}
            <div className='absolute inset-0 bg-black/25' aria-hidden='true' />
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-y-8 p-8 text-center'>
                <h1 className='max-w-3xl text-on-dark text-4xl font-bold uppercase tracking-[0.05em] leading-tight text-balance'>
                    {label}
                </h1>
                {ctaHref && ctaLabel && (
                    <Link
                        href={ctaHref}
                        className='inline-flex items-center justify-center border border-white bg-white px-9 py-4 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:bg-transparent hover:text-white'
                    >
                        {ctaLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}

export default Billboard;
