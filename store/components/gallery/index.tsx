"use client"

import Image from 'next/image';
import { Tab } from '@headlessui/react';
import { Image as ImageType } from '@/types'
import GalleryTab from './gallery-tab';
import { useTranslations } from 'next-intl';


interface GalleryProps {
    images: ImageType[];
    alt?: string;
}

const Gallery: React.FC<GalleryProps> = ({ images, alt }) => {
    const t = useTranslations('Product');
    const imageAlt = alt || t('imageAlt');
    return (
        <Tab.Group as="div" className="flex flex-col">
            <Tab.Panels className="w-full aspect-square">
                {images.map(image => (
                    <Tab.Panel key={image.id}>
                        <div className='relative w-full h-full overflow-hidden aspect-square rounded-none bg-placeholder'>
                            <Image fill src={image.url} alt={imageAlt} className='object-cover object-center' />
                        </div>
                    </Tab.Panel>
                ))}
            </Tab.Panels>
            <div className='hidden w-full mt-3 sm:block'>
                <Tab.List className="grid grid-cols-4 gap-3">
                    {images.map(image => (
                        <GalleryTab key={image.id} image={image} alt={imageAlt} />
                    ))}
                </Tab.List>
            </div>
        </Tab.Group>
     );
}

export default Gallery;
