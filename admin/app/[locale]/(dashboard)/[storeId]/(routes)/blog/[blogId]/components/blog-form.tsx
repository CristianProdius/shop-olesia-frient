"use client"

import { useState } from 'react'
import * as z from 'zod'
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
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertModal } from '@/components/modals/alert-modal';
import ImageUpload from '@/components/ui/image-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface BlogFormProps {
    initialData: BlogPost | null;
}

// `title` and `content` are derived from the English translations in onSubmit,
// so they are optional here; the English title + content are what we validate.
const hasText = (html?: string) =>
    !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;

const formSchema = z.object({
    slug: z.string().min(1),
    title: z.string().optional(),
    titleI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    excerpt: z.string().optional(),
    excerptI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    content: z.string().optional(),
    contentI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    coverImage: z.string().optional(),
    isPublished: z.boolean().default(false).optional(),
})
    .refine((d) => !!d.titleI18n?.en?.trim(), { message: "Required", path: ["titleI18n", "en"] })
    .refine((d) => hasText(d.contentI18n?.en), { message: "Required", path: ["contentI18n", "en"] })

type BlogFormValues = z.infer<typeof formSchema>;

type Lang = 'en' | 'ru' | 'ro';

export const BlogForm: React.FC<BlogFormProps> = ({
    initialData,
}) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Blog');
    const tModals = useTranslations('Modals');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeLang, setActiveLang] = useState<Lang>('en');

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updated') : t('created')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<BlogFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            slug: initialData?.slug ?? '',
            title: initialData?.title ?? '',
            titleI18n: (initialData?.titleI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            excerpt: initialData?.excerpt ?? '',
            excerptI18n: (initialData?.excerptI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            content: initialData?.content ?? '',
            contentI18n: (initialData?.contentI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            coverImage: initialData?.coverImage ?? '',
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
            values.content = values.contentI18n?.en || '';
            values.title = values.titleI18n?.en || values.title;
            values.excerpt = values.excerptI18n?.en || values.excerpt;
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

    const langs: { value: Lang; label: string }[] = [
        { value: 'en', label: t('english') },
        { value: 'ru', label: t('russian') },
        { value: 'ro', label: t('romanian') },
    ];

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
                        <Trash className="size-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm uppercase tracking-wide'>{t('editTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-6'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                                </div>
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
                                <FormField
                                    control={form.control}
                                    name="isPublished"
                                    render={({ field }) => (
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
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm uppercase tracking-wide'>{t('content')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-6'>
                                <div className='flex flex-wrap gap-2'>
                                    {langs.map((lang) => (
                                        <Button
                                            key={lang.value}
                                            type='button'
                                            size='sm'
                                            variant={activeLang === lang.value ? 'default' : 'outline'}
                                            disabled={loading}
                                            onClick={() => setActiveLang(lang.value)}
                                        >
                                            {lang.label}
                                        </Button>
                                    ))}
                                </div>
                                <FormField
                                    control={form.control}
                                    name={`titleI18n.${activeLang}`}
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
                                    name={`excerptI18n.${activeLang}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('excerpt')}</FormLabel>
                                            <FormControl>
                                                <textarea
                                                    disabled={loading}
                                                    placeholder={t('excerptPlaceholder')}
                                                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <FormLabel>{t('content')}</FormLabel>
                                    <FormControl>
                                        <RichTextEditor
                                            key={activeLang}
                                            value={form.watch(`contentI18n.${activeLang}`) || ''}
                                            onChange={(html) => form.setValue(`contentI18n.${activeLang}`, html, { shouldDirty: true })}
                                            placeholder={t('content')}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                </FormItem>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <Button
                            type='button'
                            variant='outline'
                            disabled={loading}
                            onClick={() => router.push(`/${params.storeId}/blog`)}
                        >
                            {tModals('cancel')}
                        </Button>
                        <Button disabled={loading} type='submit'>{action}</Button>
                    </div>
                </form>
            </Form>
        </>
    )
}
