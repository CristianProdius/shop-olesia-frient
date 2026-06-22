"use client"

import { useState } from 'react'
import * as z from 'zod'
import { Size } from "@prisma/client";
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
    initialData: Size | null;
}

const formSchema = z.object({
    name: z.string().min(1),
    value: z.string().min(1),
    nameI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
})

type SizeFormValues = z.infer<typeof formSchema>;

export const SizeForm: React.FC<SettingsFromProps> = ({ initialData }) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Sizes');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updated') : t('created')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<SizeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            value: initialData.value,
            nameI18n: (initialData.nameI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
        } : {
            name: '',
            value: '',
            nameI18n: { en: '', ru: '', ro: '' },
        }
    });

    const onSubmit = async (data: SizeFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/sizes/${params.sizeId}`, data)
            } else {
                await axios.post(`/api/${params.storeId}/sizes`, data)
            }
            router.refresh();
            router.push(`/${params.storeId}/sizes`);
            toast.success(toastMessage)
        } catch(err) {
            toast.error(t('somethingWrong'));
        } finally {
            setLoading(false)
        }
    }

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/sizes/${params.sizeId}`)
            router.refresh();
            router.push(`/${params.storeId}/sizes`)
            toast.success(t('deleted'))
        } catch(err) {
            toast.error(t('deleteConstraint'));
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
                    <div className='grid grid-cols-3 gap-8'>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('formName')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="value"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('formValue')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('valuePlaceholder')} {...field} />
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
                                name="nameI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nameI18n.ru"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('russian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nameI18n.ro"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('romanian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} />
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