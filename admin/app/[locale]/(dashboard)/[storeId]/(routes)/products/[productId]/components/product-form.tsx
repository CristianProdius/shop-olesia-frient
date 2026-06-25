"use client"

import { useState } from 'react'
import * as z from 'zod'
import { Category, Color, Image, Product, Size } from "@prisma/client";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductFromProps {
    initialData: Product & {
        images: Image[]
    } | null;
    categories: Category[]
    colors: Color[]
    sizes: Size[]
}

const formSchema = z.object({
    name: z.string().min(1),
    nameI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    description: z.string().optional(),
    descriptionI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    material: z.string().optional(),
    materialI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    care: z.string().optional(),
    careI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    sku: z.string().optional(),
    images: z.object({ url: z.string() }).array(),
    price: z.coerce.number().min(1),
    categoryId: z.string().min(1),
    colorId: z.string().min(1),
    sizeId: z.string().min(1),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional()
    
})

type ProductFormValues = z.infer<typeof formSchema>;

export const ProductForm: React.FC<ProductFromProps> = ({
    initialData,
    categories,
    colors,
    sizes
}) => {

    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Products');
    const tModals = useTranslations('Modals');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? t('editTitle') : t('createTitle')
    const description = initialData ? t('editDescription') : t('createDescription')
    const toastMessage = initialData ? t('updated') : t('created')
    const action = initialData ? t('saveChanges') : t('create')

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            ...initialData,
            nameI18n: (initialData?.nameI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            description: initialData?.description ?? '',
            descriptionI18n: (initialData?.descriptionI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            material: initialData?.material ?? '',
            materialI18n: (initialData?.materialI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            care: initialData?.care ?? '',
            careI18n: (initialData?.careI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            sku: initialData?.sku ?? '',
            price: parseFloat(String(initialData?.price))
        } : {
            name: '',
            nameI18n: { en: '', ru: '', ro: '' },
            description: '',
            descriptionI18n: { en: '', ru: '', ro: '' },
            material: '',
            materialI18n: { en: '', ru: '', ro: '' },
            care: '',
            careI18n: { en: '', ru: '', ro: '' },
            sku: '',
            images: [],
            price: 0,
            categoryId: '',
            colorId: '',
            sizeId: '',
            isFeatured: false,
            isArchived: false,
        }
    });

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/products/${params.productId}`, data)
            } else {
                await axios.post(`/api/${params.storeId}/products`, data)
            }
            router.refresh();
            router.push(`/${params.storeId}/products`);
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
            await axios.delete(`/api/${params.storeId}/products/${params.productId}`)
            router.refresh();
            router.push(`/${params.storeId}/products`)
            toast.success(t('deleted'))
        } catch(err) {
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
                        <Trash className="size-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm uppercase tracking-wide'>{t('backgroundImage')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="images"
                                render={({field}) => (
                                    <FormItem>
                                        <FormControl>
                                            <ImageUpload
                                                value={field.value.map((image) => image.url)}
                                                disabled={loading}
                                                onChange={(url) => field.onChange([...field.value, { url }])}
                                                onRemove={(url) => field.onChange([...field.value.filter((image) => image.url !== url)])}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm uppercase tracking-wide'>{t('name')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <FormField
                            control={form.control} 
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('name')}</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} 
                            name="price"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('price')}</FormLabel>
                                    <FormControl>
                                        <Input type="number" disabled={loading} placeholder={t('pricePlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} 
                            name="categoryId"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('category')}</FormLabel>
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
                                                    placeholder={t('selectCategory')}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(category => (
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
                            name="sizeId"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('size')}</FormLabel>
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
                                                    placeholder={t('selectSize')}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sizes.map(size => (
                                                <SelectItem key={size.id} value={size.id}>
                                                    {size.name}
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
                            name="colorId"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('color')}</FormLabel>
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
                                                    placeholder={t('selectColor')}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {colors.map(color => (
                                                <SelectItem style={{ display: 'flex' }} key={color.id} value={color.id}>
                                                    <span style={{ color: color.value }}>{color.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm uppercase tracking-wide'>{t('featured')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <FormField
                            control={form.control}
                            name="isFeatured"
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
                                            {t('featured')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t('featuredDescription')}
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} 
                            name="isArchived"
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
                                            {t('archived')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t('archivedDescription')}
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
                            <CardTitle className='text-sm uppercase tracking-wide'>{t('translations')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <FormField
                                control={form.control}
                                name="nameI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Input disabled={loading} placeholder={t('namePlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-sm uppercase tracking-wide'>{t('description')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <div className='space-y-6'>
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('sku')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('skuPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('description')}</FormLabel>
                                        <FormControl>
                                            <textarea
                                                disabled={loading}
                                                placeholder={t('descriptionPlaceholder')}
                                                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <p className='text-xs uppercase tracking-wide text-muted-foreground'>{t('translations')}</p>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                <FormField
                                    control={form.control}
                                    name="descriptionI18n.en"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('english')}</FormLabel>
                                            <FormControl>
                                                <textarea
                                                    disabled={loading}
                                                    placeholder={t('descriptionPlaceholder')}
                                                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="descriptionI18n.ru"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('russian')}</FormLabel>
                                            <FormControl>
                                                <textarea
                                                    disabled={loading}
                                                    placeholder={t('descriptionPlaceholder')}
                                                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="descriptionI18n.ro"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('romanian')}</FormLabel>
                                            <FormControl>
                                                <textarea
                                                    disabled={loading}
                                                    placeholder={t('descriptionPlaceholder')}
                                                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="material"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('material')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('materialPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <p className='text-xs uppercase tracking-wide text-muted-foreground'>{t('translations')}</p>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                <FormField
                                    control={form.control}
                                    name="materialI18n.en"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('english')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('materialPlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="materialI18n.ru"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('russian')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('materialPlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="materialI18n.ro"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('romanian')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('materialPlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="care"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('care')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder={t('carePlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <p className='text-xs uppercase tracking-wide text-muted-foreground'>{t('translations')}</p>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                <FormField
                                    control={form.control}
                                    name="careI18n.en"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('english')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('carePlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="careI18n.ru"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('russian')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('carePlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="careI18n.ro"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{t('romanian')}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={t('carePlaceholder')} {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <Button
                            type='button'
                            variant='outline'
                            disabled={loading}
                            onClick={() => router.push(`/${params.storeId}/products`)}
                        >
                            {tModals('cancel')}
                        </Button>
                        <Button disabled={loading} type='submit'>{action}</Button>
                    </div>
                </form>
            </Form>
            {/* <Separator /> */}
        </>
    )
}