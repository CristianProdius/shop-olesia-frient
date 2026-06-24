"use client"

import { useState } from 'react'
import * as z from 'zod'
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ReviewFormProps {
    products: { id: string; name: string }[];
}

const formSchema = z.object({
    productId: z.string().min(1),
    customerName: z.string().optional(),
    rating: z.coerce.number().int().min(1).max(5),
    body: z.string().optional().nullable(),
    bodyI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    fitVote: z.string().optional().nullable(),
    source: z.string().min(1),
    status: z.string().min(1),
    verified: z.boolean().default(false).optional(),
})

type ReviewFormValues = z.infer<typeof formSchema>;

export const ReviewForm: React.FC<ReviewFormProps> = ({ products }) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Reviews');

    const [loading, setLoading] = useState(false);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productId: '',
            customerName: '',
            rating: 5,
            body: '',
            bodyI18n: { en: '', ru: '', ro: '' },
            fitVote: '',
            source: 'instagram',
            status: 'approved',
            verified: false,
        }
    });

    const onSubmit = async (data: ReviewFormValues) => {
        try {
            setLoading(true);
            await axios.post(`/api/${params.storeId}/reviews`, data)
            router.refresh();
            router.push(`/${params.storeId}/reviews`);
            toast.success(t('createdToast'))
        } catch {
            toast.error(t('somethingWentWrong'));
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading title={t('createTitle')} description={t('createDescription')} />
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
                    <div className='grid grid-cols-3 gap-8'>
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('productField')}</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value} placeholder={t('productPlaceholder')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('customerField')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('customerPlaceholder')} {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('ratingField')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" min={1} max={5} disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="source"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('sourceField')}</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="web">{t('source_web')}</SelectItem>
                                            <SelectItem value="instagram">{t('source_instagram')}</SelectItem>
                                            <SelectItem value="import">{t('source_import')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('statusField')}</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="pending">{t('status_pending')}</SelectItem>
                                            <SelectItem value="approved">{t('status_approved')}</SelectItem>
                                            <SelectItem value="rejected">{t('status_rejected')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fitVote"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('fitField')}</FormLabel>
                                    <Select disabled={loading} onValueChange={field.onChange} value={field.value ?? ''} defaultValue={field.value ?? ''}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue defaultValue={field.value ?? ''} placeholder={t('fitPlaceholder')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="small">{t('fit_small')}</SelectItem>
                                            <SelectItem value="true">{t('fit_true')}</SelectItem>
                                            <SelectItem value="large">{t('fit_large')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="verified"
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
                                        <FormLabel>{t('verifiedField')}</FormLabel>
                                        <FormDescription>{t('verifiedDescription')}</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className='space-y-4'>
                        <FormLabel>{t('bodyField')}</FormLabel>
                        <FormField
                            control={form.control}
                            name="body"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea disabled={loading} placeholder={t('bodyPlaceholder')} {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className='space-y-4'>
                        <FormLabel>{t('bodyTranslations')}</FormLabel>
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
                    <Button disabled={loading} className='ml-auto' type='submit'>{t('create')}</Button>
                </form>
            </Form>
        </>
    )
}
