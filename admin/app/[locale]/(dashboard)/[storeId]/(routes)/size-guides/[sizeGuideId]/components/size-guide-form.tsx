"use client"

import { useState } from 'react'
import * as z from 'zod'
import { SizeGuide, Category } from "@prisma/client";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertModal } from '@/components/modals/alert-modal';
import { Checkbox } from '@/components/ui/checkbox';

interface SizeGuideFormProps {
    initialData: SizeGuide | null;
    categories: Category[];
}

type SizeGuideRow = { label: string; values: string[] };
type ColumnsI18n = { en?: string[]; ru?: string[]; ro?: string[] };

const csvToArray = (value?: string): string[] =>
    (value ?? '').split(',').map((v) => v.trim()).filter(Boolean);
const arrayToCsv = (value?: string[]): string => (value ?? []).join(', ');
const rowsToText = (rows: SizeGuideRow[]): string =>
    rows.map((r) => [r.label, ...(r.values ?? [])].join(', ')).join('\n');
const textToRows = (text?: string): SizeGuideRow[] =>
    (text ?? '')
        .split('\n')
        .map((line) => line.split(',').map((c) => c.trim()))
        .filter((parts) => parts.length > 0 && parts[0])
        .map((parts) => ({ label: parts[0], values: parts.slice(1).filter((v) => v.length > 0) }));

const formSchema = z.object({
    categoryId: z.string().min(1),
    title: z.string().optional().nullable(),
    titleI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    columnsCsv: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    rowsCsv: z.string().optional(),
    order: z.coerce.number().int(),
    isPublished: z.boolean().default(true).optional(),
})

type SizeGuideFormValues = z.infer<typeof formSchema>;

export const SizeGuideForm: React.FC<SizeGuideFormProps> = ({ initialData, categories }) => {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('SizeGuides');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updatedToast') : t('createdToast')
    const action = initialData ? t('saveChanges') : t('create')

    const initialColumns = (initialData?.columnsI18n as ColumnsI18n | null) ?? {};
    const initialRows = (initialData?.rows as SizeGuideRow[] | null) ?? [];

    const form = useForm<SizeGuideFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            categoryId: initialData.categoryId,
            title: initialData.title ?? '',
            titleI18n: (initialData.titleI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            columnsCsv: {
                en: arrayToCsv(initialColumns.en),
                ru: arrayToCsv(initialColumns.ru),
                ro: arrayToCsv(initialColumns.ro),
            },
            rowsCsv: rowsToText(initialRows),
            order: initialData.order,
            isPublished: initialData.isPublished,
        } : {
            categoryId: '',
            title: '',
            titleI18n: { en: '', ru: '', ro: '' },
            columnsCsv: { en: '', ru: '', ro: '' },
            rowsCsv: '',
            order: 0,
            isPublished: true,
        }
    });

    const onSubmit = async (data: SizeGuideFormValues) => {
        try {
            setLoading(true);
            const columnsI18n = {
                en: csvToArray(data.columnsCsv?.en),
                ru: csvToArray(data.columnsCsv?.ru),
                ro: csvToArray(data.columnsCsv?.ro),
            };
            const rows = textToRows(data.rowsCsv);
            const payload = {
                categoryId: data.categoryId,
                title: data.title,
                titleI18n: data.titleI18n,
                columnsI18n,
                rows,
                order: data.order,
                isPublished: data.isPublished,
            };
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/size-guides/${params.sizeGuideId}`, payload)
            } else {
                await axios.post(`/api/${params.storeId}/size-guides`, payload)
            }
            router.refresh();
            router.push(`/${params.storeId}/size-guides`);
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
            await axios.delete(`/api/${params.storeId}/size-guides/${params.sizeGuideId}`)
            router.refresh();
            router.push(`/${params.storeId}/size-guides`)
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
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('categoryField')}</FormLabel>
                                    <Select
                                        disabled={loading}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value} placeholder={t('selectCategory')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
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
                            name="title"
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
                            name="order"
                            render={({ field }) => (
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
                                        <FormLabel>{t('published')}</FormLabel>
                                        <FormDescription>{t('publishedDescription')}</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className='space-y-4'>
                        <FormLabel>{t('titleTranslations')}</FormLabel>
                        <div className='grid grid-cols-3 gap-8'>
                            {(['en', 'ru', 'ro'] as const).map((loc) => (
                                <FormField
                                    key={loc}
                                    control={form.control}
                                    name={`titleI18n.${loc}` as const}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t(loc)}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('titlePlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <FormLabel>{t('columnsField')}</FormLabel>
                        <FormDescription>{t('columnsHelp')}</FormDescription>
                        <div className='grid grid-cols-3 gap-8'>
                            {(['en', 'ru', 'ro'] as const).map((loc) => (
                                <FormField
                                    key={loc}
                                    control={form.control}
                                    name={`columnsCsv.${loc}` as const}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t(loc)}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('columnsPlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <FormLabel>{t('rowsField')}</FormLabel>
                        <FormDescription>{t('rowsHelp')}</FormDescription>
                        <FormField
                            control={form.control}
                            name="rowsCsv"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea disabled={loading} rows={6} placeholder={t('rowsPlaceholder')} {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button disabled={loading} className='ml-auto' type='submit'>{action}</Button>
                </form>
            </Form>
        </>
    )
}
