"use client"

import { useState } from 'react'
import * as z from 'zod'
import { Stat } from "@prisma/client";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertModal } from '@/components/modals/alert-modal';
import { Checkbox } from '@/components/ui/checkbox';

interface StatFormProps {
    initialData: Stat | null;
}

const formSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    labelI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    value: z.string().min(1),
    order: z.coerce.number().int(),
    isPublished: z.boolean().default(true).optional(),
})

type StatFormValues = z.infer<typeof formSchema>;

export const StatForm: React.FC<StatFormProps> = ({ initialData }) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Stats');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updatedToast') : t('createdToast')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<StatFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            key: initialData.key,
            label: initialData.label,
            labelI18n: (initialData.labelI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            value: initialData.value,
            order: initialData.order,
            isPublished: initialData.isPublished,
        } : {
            key: '',
            label: '',
            labelI18n: { en: '', ru: '', ro: '' },
            value: '',
            order: 0,
            isPublished: true,
        }
    });

    const onSubmit = async (data: StatFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/stats/${params.statId}`, data)
            } else {
                await axios.post(`/api/${params.storeId}/stats`, data)
            }
            router.refresh();
            router.push(`/${params.storeId}/stats`);
            toast.success(toastMessage)
        } catch {
            toast.error(t('somethingWentWrong'));
        } finally {
            setLoading(false)
        }
    }

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/stats/${params.statId}`)
            router.refresh();
            router.push(`/${params.storeId}/stats`)
            toast.success(t('deletedToast'))
        } catch {
            toast.error(t('somethingWentWrong'));
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
                            name="key"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('keyField')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('keyPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                        <FormField
                            control={form.control}
                            name="value"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('valueField')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('valuePlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="order"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('order')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" disabled={loading} placeholder={t('orderPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isPublished"
                            render={({field}) => (
                                <FormItem className='flex flex-row items-start p-4 space-x-3 space-y-0 border rounded-md'>
                                    <FormControl>
                                        <Checkbox
                                            // @ts-ignore
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className='space-y-1 leading-none'>
                                        <FormLabel>
                                            {t('published')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t('publishedDescription')}
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className='space-y-4'>
                        <FormLabel>{t('labelTranslations')}</FormLabel>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="labelI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('labelPlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Input disabled={loading} placeholder={t('labelPlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Input disabled={loading} placeholder={t('labelPlaceholder')} {...field} value={field.value ?? ''} />
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
        </>
    )
}
