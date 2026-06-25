"use client"

import { useState } from 'react'
import * as z from 'zod'
import axios from 'axios'
import { BlogPost } from "@prisma/client";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertModal } from '@/components/modals/alert-modal';
import ImageUpload from '@/components/ui/image-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';

interface BlogFormProps {
    initialData: BlogPost | null;
}

const i18nField = z.object({
    en: z.string().optional(),
    ru: z.string().optional(),
    ro: z.string().optional(),
});

const stripTags = (html?: string) => (html ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

const formSchema = z.object({
    slug: z.string().min(1),
    title: z.string().optional(),
    titleI18n: i18nField,
    excerpt: z.string().optional().nullable(),
    excerptI18n: i18nField,
    content: z.string().optional(),
    contentI18n: i18nField,
    coverImage: z.string().optional().nullable(),
    isPublished: z.boolean().default(false).optional(),
}).refine((data) => !!data.titleI18n?.en && data.titleI18n.en.trim().length > 0, {
    message: 'Required',
    path: ['titleI18n', 'en'],
}).refine((data) => stripTags(data.contentI18n?.en).length > 0, {
    message: 'Required',
    path: ['contentI18n', 'en'],
});

type BlogFormValues = z.infer<typeof formSchema>;

type Lang = 'en' | 'ru' | 'ro';

const LANGS: { value: Lang; labelKey: 'english' | 'russian' | 'romanian' }[] = [
    { value: 'en', labelKey: 'english' },
    { value: 'ru', labelKey: 'russian' },
    { value: 'ro', labelKey: 'romanian' },
];

export const BlogForm: React.FC<BlogFormProps> = ({
    initialData,
}) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Blog');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<Lang>('en');

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updated') : t('created')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<BlogFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            slug: initialData.slug,
            title: initialData.title ?? '',
            titleI18n: (initialData.titleI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            excerpt: initialData.excerpt ?? '',
            excerptI18n: (initialData.excerptI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            content: initialData.content ?? '',
            contentI18n: (initialData.contentI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            coverImage: initialData.coverImage ?? '',
            isPublished: initialData.isPublished,
        } : {
            slug: '',
            title: '',
            titleI18n: { en: '', ru: '', ro: '' },
            excerpt: '',
            excerptI18n: { en: '', ru: '', ro: '' },
            content: '',
            contentI18n: { en: '', ru: '', ro: '' },
            coverImage: '',
            isPublished: false,
        }
    });

    const onSubmit = async (values: BlogFormValues) => {
        try {
            setLoading(true);
            values.title = values.titleI18n.en ?? '';
            values.content = values.contentI18n.en ?? '';
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/blog/${params.blogId}`, values)
            } else {
                await axios.post(`/api/${params.storeId}/blog`, values)
            }
            router.refresh();
            router.push(`/${params.storeId}/blog`);
            toast.success(toastMessage)
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                toast.error(t('slugConflict'));
            } else {
                toast.error(t('somethingWrong'));
            }
        } finally {
            setLoading(false)
        }
    }

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/blog/${params.blogId}`)
            router.refresh();
            router.push(`/${params.storeId}/blog`)
            toast.success(t('deleted'))
        } catch (err) {
            toast.error(t('somethingWrong'));
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
                    <Button variant="destructive" size="sm" onClick={() => setOpen(true)} disabled={loading} aria-label={t('delete')}>
                        <Trash className="w-4 h-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
                    <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('coverImage')}</FormLabel>
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
                    <div className="grid grid-cols-3 gap-8">
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('slug')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('slugPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isPublished"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start p-4 space-x-3 space-y-0 border rounded-md">
                                    <FormControl>
                                        <Checkbox
                                            // @ts-ignore
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            {t('isPublished')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t('isPublishedDescription')}
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4">
                        <FormLabel>{t('translations')}</FormLabel>
                        <div className="flex items-center gap-2">
                            {LANGS.map((l) => (
                                <button
                                    key={l.value}
                                    type="button"
                                    onClick={() => setLang(l.value)}
                                    className={cn(
                                        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                        lang === l.value
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    )}
                                >
                                    {t(l.labelKey)}
                                </button>
                            ))}
                        </div>
                        {LANGS.map((l) => (
                            <div key={l.value} className={cn('space-y-6', lang === l.value ? 'block' : 'hidden')}>
                                <FormField
                                    control={form.control}
                                    name={`titleI18n.${l.value}` as const}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('titleField')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('titlePlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`excerptI18n.${l.value}` as const}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('excerpt')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('excerptPlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`contentI18n.${l.value}` as const}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('content')}</FormLabel>
                                            <FormControl>
                                                <RichTextEditor
                                                    value={field.value ?? ''}
                                                    onChange={field.onChange}
                                                    disabled={loading}
                                                    placeholder={t('content')}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                    <Button disabled={loading} className="ml-auto" type="submit">{action}</Button>
                </form>
            </Form>
        </>
    )
}
