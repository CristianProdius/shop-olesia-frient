"use client"

import { useState } from 'react'
import * as z from 'zod'
import { Faq } from "@prisma/client";
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
import { Checkbox } from '@/components/ui/checkbox';

interface FaqFormProps {
    initialData: Faq | null;
}

const formSchema = z.object({
    category: z.string().optional().nullable(),
    categoryI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    question: z.string().min(1),
    questionI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    answer: z.string().min(1),
    answerI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    order: z.coerce.number().int(),
    isPublished: z.boolean().default(true).optional(),
})

type FaqFormValues = z.infer<typeof formSchema>;

export const FaqForm: React.FC<FaqFormProps> = ({ initialData }) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Faqs');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updatedToast') : t('createdToast')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<FaqFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            category: initialData.category ?? '',
            categoryI18n: (initialData.categoryI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            question: initialData.question,
            questionI18n: (initialData.questionI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            answer: initialData.answer,
            answerI18n: (initialData.answerI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            order: initialData.order,
            isPublished: initialData.isPublished,
        } : {
            category: '',
            categoryI18n: { en: '', ru: '', ro: '' },
            question: '',
            questionI18n: { en: '', ru: '', ro: '' },
            answer: '',
            answerI18n: { en: '', ru: '', ro: '' },
            order: 0,
            isPublished: true,
        }
    });

    const onSubmit = async (data: FaqFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/faqs/${params.faqId}`, data)
            } else {
                await axios.post(`/api/${params.storeId}/faqs`, data)
            }
            router.refresh();
            router.push(`/${params.storeId}/faqs`);
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
            await axios.delete(`/api/${params.storeId}/faqs/${params.faqId}`)
            router.refresh();
            router.push(`/${params.storeId}/faqs`)
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
                            name="category"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('categoryField')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('categoryPlaceholder')} {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="question"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('questionField')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('questionPlaceholder')} {...field} />
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
                        <FormLabel>{t('answerField')}</FormLabel>
                        <FormField
                            control={form.control}
                            name="answer"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea disabled={loading} placeholder={t('answerPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className='space-y-4'>
                        <FormLabel>{t('categoryTranslations')}</FormLabel>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="categoryI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('categoryPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="categoryI18n.ru"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('russian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('categoryPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="categoryI18n.ro"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('romanian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('categoryPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <FormLabel>{t('questionTranslations')}</FormLabel>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="questionI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('questionPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="questionI18n.ru"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('russian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('questionPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="questionI18n.ro"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('romanian')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('questionPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <FormLabel>{t('answerTranslations')}</FormLabel>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="answerI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('answerPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="answerI18n.ru"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('russian')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('answerPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="answerI18n.ro"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('romanian')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('answerPlaceholder')} {...field} value={field.value ?? ''} />
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
