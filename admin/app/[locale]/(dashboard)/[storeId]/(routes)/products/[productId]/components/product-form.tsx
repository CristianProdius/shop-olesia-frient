"use client"

import { useState } from 'react'
import * as z from 'zod'
import { Category, Color, Image, Product, ProductVariant, Size } from "@prisma/client";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash } from "lucide-react";
import { useForm, useFieldArray } from 'react-hook-form';
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

interface ProductFromProps {
    initialData: Product & {
        images: Image[]
        variants: ProductVariant[]
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
    sku: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    descriptionI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    material: z.string().optional().nullable(),
    materialI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    care: z.string().optional().nullable(),
    careI18n: z.object({
        en: z.string().optional(),
        ru: z.string().optional(),
        ro: z.string().optional(),
    }).optional(),
    images: z.object({ url: z.string() }).array(),
    price: z.coerce.number().min(1),
    categoryId: z.string().min(1),
    colorId: z.string().min(1),
    sizeId: z.string().min(1),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional(),
    variants: z.array(z.object({
        sizeId: z.string().min(1),
        colorId: z.string().min(1),
        sku: z.string().optional().nullable(),
        stockQty: z.coerce.number().int().min(0)
    }))
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
            descriptionI18n: (initialData?.descriptionI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            materialI18n: (initialData?.materialI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            careI18n: (initialData?.careI18n as { en?: string; ru?: string; ro?: string } | null) ?? { en: '', ru: '', ro: '' },
            sku: initialData?.sku ?? '',
            price: parseFloat(String(initialData?.price)),
            variants: (initialData?.variants ?? []).map((variant) => ({
                sizeId: variant.sizeId,
                colorId: variant.colorId,
                sku: variant.sku ?? '',
                stockQty: variant.stockQty,
            }))
        } : {
            name: '',
            nameI18n: { en: '', ru: '', ro: '' },
            sku: '',
            description: '',
            descriptionI18n: { en: '', ru: '', ro: '' },
            material: '',
            materialI18n: { en: '', ru: '', ro: '' },
            care: '',
            careI18n: { en: '', ru: '', ro: '' },
            images: [],
            price: 0,
            categoryId: '',
            colorId: '',
            sizeId: '',
            isFeatured: false,
            isArchived: false,
            variants: [],
        }
    });

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control: form.control,
        name: 'variants',
    });

    const watchedVariants = form.watch('variants');

    const duplicateVariantIndexes = (() => {
        const seen = new Map<string, number>();
        const duplicates = new Set<number>();
        (watchedVariants ?? []).forEach((variant, index) => {
            if (!variant?.sizeId || !variant?.colorId) return;
            const key = `${variant.sizeId}:${variant.colorId}`;
            if (seen.has(key)) {
                duplicates.add(index);
            } else {
                seen.set(key, index);
            }
        });
        return duplicates;
    })();

    const hasDuplicateVariants = duplicateVariantIndexes.size > 0;

    const onSubmit = async (data: ProductFormValues) => {
        if (hasDuplicateVariants) {
            toast.error(t('duplicateVariant'));
            return;
        }
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
                        name="images"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>{t('backgroundImage')}</FormLabel>
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
                    <div className='grid grid-cols-3 gap-8'>
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
                    </div>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <FormLabel>{t('descriptionLabel')}</FormLabel>
                            <AiGenerateButton
                                kind='translate'
                                field='product description'
                                disabled={loading}
                                sourceText={form.watch('descriptionI18n.en') ?? ''}
                                targetLocales={['ru', 'ro']}
                                onResult={(values) => {
                                    if (values.ru !== undefined) form.setValue('descriptionI18n.ru', values.ru, { shouldDirty: true });
                                    if (values.ro !== undefined) form.setValue('descriptionI18n.ro', values.ro, { shouldDirty: true });
                                }}
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="descriptionI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('descriptionPlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Textarea disabled={loading} placeholder={t('descriptionPlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Textarea disabled={loading} placeholder={t('descriptionPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <FormLabel>{t('materialLabel')}</FormLabel>
                            <AiGenerateButton
                                kind='translate'
                                field='product material'
                                disabled={loading}
                                sourceText={form.watch('materialI18n.en') ?? ''}
                                targetLocales={['ru', 'ro']}
                                onResult={(values) => {
                                    if (values.ru !== undefined) form.setValue('materialI18n.ru', values.ru, { shouldDirty: true });
                                    if (values.ro !== undefined) form.setValue('materialI18n.ro', values.ro, { shouldDirty: true });
                                }}
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="materialI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('materialPlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Textarea disabled={loading} placeholder={t('materialPlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Textarea disabled={loading} placeholder={t('materialPlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <FormLabel>{t('careLabel')}</FormLabel>
                            <AiGenerateButton
                                kind='translate'
                                field='product care instructions'
                                disabled={loading}
                                sourceText={form.watch('careI18n.en') ?? ''}
                                targetLocales={['ru', 'ro']}
                                onResult={(values) => {
                                    if (values.ru !== undefined) form.setValue('careI18n.ru', values.ru, { shouldDirty: true });
                                    if (values.ro !== undefined) form.setValue('careI18n.ro', values.ro, { shouldDirty: true });
                                }}
                            />
                        </div>
                        <div className='grid grid-cols-3 gap-8'>
                            <FormField
                                control={form.control}
                                name="careI18n.en"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('english')}</FormLabel>
                                        <FormControl>
                                            <Textarea disabled={loading} placeholder={t('carePlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Textarea disabled={loading} placeholder={t('carePlaceholder')} {...field} value={field.value ?? ''} />
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
                                            <Textarea disabled={loading} placeholder={t('carePlaceholder')} {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                            <FormLabel>{t('variants')}</FormLabel>
                            <Button
                                type='button'
                                size='sm'
                                variant='secondary'
                                disabled={loading}
                                onClick={() => appendVariant({ sizeId: '', colorId: '', sku: '', stockQty: 0 })}
                            >
                                <Plus className='w-4 h-4 mr-2' />
                                {t('addVariant')}
                            </Button>
                        </div>
                        {variantFields.map((field, index) => (
                            <div key={field.id} className='space-y-2'>
                                <div className='grid grid-cols-1 gap-4 md:grid-cols-5 md:items-end'>
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.sizeId`}
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
                                                            <SelectValue defaultValue={field.value} placeholder={t('selectSize')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {sizes.map(size => (
                                                            <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.colorId`}
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
                                                            <SelectValue defaultValue={field.value} placeholder={t('selectColor')} />
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
                                    <FormField
                                        control={form.control}
                                        name={`variants.${index}.sku`}
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
                                        name={`variants.${index}.stockQty`}
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>{t('stock')}</FormLabel>
                                                <FormControl>
                                                    <Input type='number' min={0} disabled={loading} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type='button'
                                        variant='destructive'
                                        size='sm'
                                        disabled={loading}
                                        onClick={() => removeVariant(index)}
                                    >
                                        <Trash className='w-4 h-4 mr-2' />
                                        {t('removeVariant')}
                                    </Button>
                                </div>
                                {duplicateVariantIndexes.has(index) && (
                                    <p className='text-sm font-medium text-destructive'>{t('duplicateVariant')}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button disabled={loading || hasDuplicateVariants} className='ml-auto' type='submit'>{action}</Button>
                </form>
            </Form>
            {/* <Separator /> */}
        </>
    )
}