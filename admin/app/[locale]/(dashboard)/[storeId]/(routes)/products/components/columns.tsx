"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Archive, Check, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action';

const HeaderCell = ({ id }: { id: string }) => {
    const t = useTranslations('Products');
    return <>{t(id)}</>;
};

export type ProductColumn = {
    id: string
    name: string
    price: string
    size: string
    category: string
    color: string
    isFeatured: boolean
    isArchived: boolean
    createdAt: string
}

export const columns: ColumnDef<ProductColumn>[] = [
    {
        accessorKey: 'name',
        header: () => <HeaderCell id="colName" />,
    },
    {
        accessorKey: 'isArchived',
        header: () => <HeaderCell id="colArchived" />,
        cell: ({ row }) =>
            row.original.isArchived ? (
                <Badge variant="destructive"><Archive className="size-3" /></Badge>
            ) : (
                <Badge variant="secondary"><Check className="size-3" /></Badge>
            ),
    },
    {
        accessorKey: 'isFeatured',
        header: () => <HeaderCell id="colFeatured" />,
        cell: ({ row }) =>
            row.original.isFeatured ? (
                <Badge variant="success"><Check className="size-3" /></Badge>
            ) : (
                <Badge variant="secondary"><Minus className="size-3" /></Badge>
            ),
    },
    {
        accessorKey: 'price',
        header: () => <HeaderCell id="colPrice" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.price}</span>,
    },
    {
        accessorKey: 'category',
        header: () => <HeaderCell id="colCategory" />,
    },
    {
        accessorKey: 'size',
        header: () => <HeaderCell id="colSize" />,
    },
    {
        accessorKey: 'color',
        header: () => <HeaderCell id="colColor" />,
        cell: ({ row }) => (
            <div className='flex items-center gap-x-2'>
                {row.original.color}
                <div className='size-6 border rounded-full' style={{ backgroundColor: row.original.color }} />
            </div>
        )
    },
    {
        accessorKey: 'createdAt',
        header: () => <HeaderCell id="colDate" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.createdAt}</span>,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />
    }
]