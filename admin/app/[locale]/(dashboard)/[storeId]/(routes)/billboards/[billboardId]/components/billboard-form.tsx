"use client"

import { useState } from 'react'
import * as z from 'zod'
import { Billboard } from "@prisma/client";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertModal } from '@/components/modals/alert-modal';
import ImageUpload from '@/components/ui/image-upload';

interface SettingsFromProps {
    initialData: Billboard | null;
}

const formSchema = z.object({
    label: z.string().min(1),
    labelI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    imageUrl: z.string().optional(),
})

type BillboardFormValues = z.infer<typeof formSchema>;

export const BillboardForm: React.FC<SettingsFromProps> = ({ initialData }) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Billboards');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updatedToast') : t('createdToast')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<BillboardFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            label: initialData.label,
            imageUrl: initialData.imageUrl,
            labelI18n: (initialData.labelI18n as { en?: string; ru?: string; ro?: string } | null) || { en: '', ru: '', ro: '' },
        } : {
            label: '',
            imageUrl: '',
            labelI18n: { en: '', ru: '', ro: '' },
        }
    });

    const onSubmit = async (data: BillboardFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/billboards/${params.billboardId}`, data)
            } else {
                await axios.post(`/api/${params.storeId}/billboards`, data)
            }
            router.refresh();
            router.push(`/${params.storeId}/billboards`);
            toast.success(toastMessage)
        } catch(err) {
            toast.error(t('somethingWentWrong'));
        } finally {
            setLoading(false)
        }
    }

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/billboards/${params.billboardId}`)
            router.refresh();
            router.push(`/${params.storeId}/billboards`)
            toast.success(t('deletedToast'))
        } catch(err) {
            toast.error(t('deleteConstraintError'));
        } finally {
            setLoading(false)
            setOpen(false);
        }
    }

    return (
        <>
            <AlertModal
            isOpen={open}
            onClose={() => setOpen(false)}
            onConfirm={onDelete}
            loading={loading}
            />
            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                    <Button variant="destructive" size="sm" onClick={() => setOpen(true)} disabled={loading}>
                        <Trash className="w-4 h-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
                    <FormField
                        control={form.control} 
                        name="imageUrl"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>{t('backgroundImage')}</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        value={field.value ? [field.value] : []}
                                        disabled={loading}
                                        onChange={(url) => field.onChange(url)}
                                        onRemove={() => field.onChange('')}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className='grid grid-cols-3 gap-8'>
                        <FormField
                            control={form.control}
                            name="label"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('labelField')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('labelPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className='space-y-4'>
                        <FormLabel>{t('translations')}</FormLabel>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="labelI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('labelPlaceholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="labelI18n.ru"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('russian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('labelPlaceholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="labelI18n.ro"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('romanian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('labelPlaceholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <Button disabled={loading} className='ml-auto' type='submit'>{action}</Button>
                </form>
            </Form>
            {/* <Separator /> */}
        </>
    )
}