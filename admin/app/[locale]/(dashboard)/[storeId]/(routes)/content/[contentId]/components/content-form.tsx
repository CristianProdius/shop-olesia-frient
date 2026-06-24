"use client"

import { useState } from 'react'
import * as z from 'zod'
import { ContentBlock } from "@prisma/client";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertModal } from '@/components/modals/alert-modal';
import ImageUpload from '@/components/ui/image-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AiGenerateButton } from '@/components/ai-generate-button';

interface ContentFormProps {
    initialData: ContentBlock | null;
}

const CONTENT_TYPES = ['brand-story', 'behind-the-scenes', 'why-choose-us', 'social-proof'] as const;

const formSchema = z.object({
    type: z.enum(CONTENT_TYPES),
    heading: z.string().optional().nullable(),
    headingI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    body: z.string().optional().nullable(),
    bodyI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    mediaUrl: z.string().optional(),
    order: z.coerce.number().int(),
    isPublished: z.boolean().default(false).optional(),
})

type ContentFormValues = z.infer<typeof formSchema>;

export const ContentForm: React.FC<ContentFormProps> = ({ initialData }) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Content');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updatedToast') : t('createdToast')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            type: initialData.type as (typeof CONTENT_TYPES)[number],
            heading: initialData.heading ?? '',
            headingI18n: (initialData.headingI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            body: initialData.body ?? '',
            bodyI18n: (initialData.bodyI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            mediaUrl: initialData.mediaUrl ?? '',
            order: initialData.order,
            isPublished: initialData.isPublished,
        } : {
            type: 'brand-story',
            heading: '',
            headingI18n: { en: '', ru: '', ro: '' },
            body: '',
            bodyI18n: { en: '', ru: '', ro: '' },
            mediaUrl: '',
            order: 0,
            isPublished: false,
        }
    });

    const onSubmit = async (data: ContentFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/content/${params.contentId}`, data)
            } else {
                await axios.post(`/api/${params.storeId}/content`, data)
            }
            router.refresh();
            router.push(`/${params.storeId}/content`);
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
            await axios.delete(`/api/${params.storeId}/content/${params.contentId}`)
            router.refresh();
            router.push(`/${params.storeId}/content`)
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
                    <FormField
                        control={form.control}
                        name="mediaUrl"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>{t('media')}</FormLabel>
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
                            name="type"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('type')}</FormLabel>
                                    <Select
                                        disabled={loading}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    defaultValue={field.value}
                                                    placeholder={t('selectType')}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CONTENT_TYPES.map(type => (
                                                <SelectItem key={type} value={type}>
                                                    {t(`type_${type}` as never)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="heading"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('headingField')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('headingPlaceholder')} {...field} value={field.value ?? ''} />
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
                        <div className='flex items-center justify-between'>
                            <FormLabel>{t('headingTranslations')}</FormLabel>
                            <AiGenerateButton
                                kind='translate'
                                field='content block heading'
                                disabled={loading}
                                sourceText={form.watch('headingI18n.en') ?? ''}
                                targetLocales={['ru', 'ro']}
                                onResult={(values) => {
                                    if (values.ru !== undefined) form.setValue('headingI18n.ru', values.ru, { shouldDirty: true });
                                    if (values.ro !== undefined) form.setValue('headingI18n.ro', values.ro, { shouldDirty: true });
                                }}
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="headingI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('headingPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="headingI18n.ru"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('russian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('headingPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="headingI18n.ro"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('romanian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('headingPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <FormLabel>{t('bodyTranslations')}</FormLabel>
                            <AiGenerateButton
                                kind='translate'
                                field='content block body'
                                disabled={loading}
                                sourceText={form.watch('bodyI18n.en') ?? ''}
                                targetLocales={['ru', 'ro']}
                                onResult={(values) => {
                                    if (values.ru !== undefined) form.setValue('bodyI18n.ru', values.ru, { shouldDirty: true });
                                    if (values.ro !== undefined) form.setValue('bodyI18n.ro', values.ro, { shouldDirty: true });
                                }}
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="bodyI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('bodyPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bodyI18n.ru"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('russian')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('bodyPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bodyI18n.ro"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('romanian')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('bodyPlaceholder')} {...field} value={field.value ?? ''} />
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
