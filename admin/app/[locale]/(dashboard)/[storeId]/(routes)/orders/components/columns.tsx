"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusBadgeClass } from './status';
import { CellAction } from './cell-action';

export type OrderColumn = {
    id: string
    customerName: string
    phone: string
    address: string
    isPaid: boolean
    status: string
    totalPrice: string
    products: string
    createdAt: string
}

const StatusCell = ({ status }: { status: string }) => {
    const t = useTranslations('Orders');
    return (
        <Badge className={cn(getStatusBadgeClass(status))}>
            {t(`status.${status}`)}
        </Badge>
    );
};

export const useOrderColumns = (): ColumnDef<OrderColumn>[] => {
    const t = useTranslations('Orders');
    return [
        {
            accessorKey: 'customerName',
            header: t('customer'),
        },
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
            accessorKey: 'status',
            header: t('statusLabel'),
            cell: ({ row }) => <StatusCell status={row.original.status} />,
        },
        {
            accessorKey: 'createdAt',
            header: t('date'),
        },
        {
            id: 'actions',
            cell: ({ row }) => <CellAction data={row.original} />,
        }
    ]
}
