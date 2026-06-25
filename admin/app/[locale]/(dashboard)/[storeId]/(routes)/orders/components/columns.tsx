"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type OrderColumn = {
    id: string
    email: string
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
            accessorKey: 'email',
            header: t('email'),
        },
        {
            accessorKey: 'phone',
            header: t('phone'),
            cell: ({ row }) => <span className="tabular-nums">{row.original.phone}</span>,
        },
        {
            accessorKey: 'address',
            header: t('address'),
        },
        {
            accessorKey: 'totalPrice',
            header: t('totalPrice'),
            cell: ({ row }) => <span className="tabular-nums">{row.original.totalPrice}</span>,
        },
        {
            accessorKey: 'isPaid',
            header: t('paid'),
            cell: ({ row }) =>
                row.original.isPaid ? (
                    <Badge variant="success"><Check className="size-3" /></Badge>
                ) : (
                    <Badge variant="secondary"><X className="size-3" /></Badge>
                ),
        },
        {
            accessorKey: 'createdAt',
            header: t('date'),
            cell: ({ row }) => <span className="tabular-nums">{row.original.createdAt}</span>,
        }
    ]
}