"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

export type OrderColumn = {
    id: string
    phone: string
    address: string
    isPaid: boolean
    totalPrice: string
    products: string
    createdAt: string
}

export const useOrderColumns = (): ColumnDef<OrderColumn>[] => {
    const t = useTranslations('Orders');
    return [
        {
            accessorKey: 'products',
            header: t('products'),
        },
        {
            accessorKey: 'phone',
            header: t('phone'),
        },
        {
            accessorKey: 'address',
            header: t('address'),
        },
        {
            accessorKey: 'totalPrice',
            header: t('totalPrice'),
        },
        {
            accessorKey: 'isPaid',
            header: t('paid'),
        },
        {
            accessorKey: 'createdAt',
            header: t('date'),
        }
    ]
}