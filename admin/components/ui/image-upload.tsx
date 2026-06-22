"use client"

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    value: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    disabled,
    onChange,
    onRemove,
    value
}) => {

    const [isMounted, setIsMounted] = useState(false);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, [])

    const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Ask our API for a presigned URL.
            const presignRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, contentType: file.type }),
            });

            if (!presignRes.ok) {
                throw new Error('Could not get upload URL');
            }

            const { uploadUrl, publicUrl } = await presignRes.json();

            // 2. PUT the file straight to MinIO.
            const putRes = await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });

            if (!putRes.ok) {
                throw new Error('Upload failed');
            }

            // 3. Store the public URL.
            onChange(publicUrl);
        } catch (err) {
            console.error(err);
            toast.error('Image upload failed.');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div>
            <div className='flex items-center gap-4 mb-4'>
                {value.map((url) => (
                    <div key={url} className='relative w-[200px] h-[200px] rounded-md overflow-hidden'>
                        <div className='absolute z-10 top-2 right-2'>
                            <Button type='button' onClick={() => onRemove(url)} variant="destructive" size="icon">
                                <Trash className='w-4 h-4'/>
                            </Button>
                        </div>
                        <Image fill className='object-cover' alt='Image' src={url} />
                    </div>
                ))}
            </div>
            <input
                ref={inputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={onFileSelected}
            />
            <Button
                type='button'
                disabled={disabled || uploading}
                variant={'secondary'}
                onClick={() => inputRef.current?.click()}
            >
                <ImagePlus className='w-4 h-4 mr-2' />
                {uploading ? 'Uploading...' : 'Upload an Image'}
            </Button>
        </div>
    )
};

export default ImageUpload
