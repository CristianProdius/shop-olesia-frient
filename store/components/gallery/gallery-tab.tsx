import Image from 'next/image';
import { Tab } from '@headlessui/react';
import { cn } from '@/lib/utils'
import { Image as ImageType } from '@/types';

interface GalleryTabProps {
    image: ImageType
    alt?: string
}

const GalleryTab: React.FC<GalleryTabProps> = ({ image, alt }) => {
    return (
        <Tab className="relative flex items-center justify-center bg-placeholder rounded-none cursor-pointer aspect-square">
            {({ selected }) => (
                <div>
                    <span className='absolute inset-0 w-full h-full overflow-hidden rounded-none aspect-square'>
                        <Image fill alt={alt || ""} src={image.url} className='object-cover object-center' />
                    </span>
                    <span className={cn("absolute inset-0 rounded-none border", selected ? "border-border-strong" : 'border-border')} />
                </div>
            )}
        </Tab>
     );
}

export default GalleryTab;
