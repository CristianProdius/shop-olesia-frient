"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
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
    },
    {
        accessorKey: 'isFeatured',
        header: () => <HeaderCell id="colFeatured" />,
    },
    {
        accessorKey: 'price',
        header: () => <HeaderCell id="colPrice" />,
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
                <div className='w-6 h-6 border rounded-full' style={{ backgroundColor: row.original.color }} />
            </div>
        )
    },
    {
        accessorKey: 'createdAt',
        header: () => <HeaderCell id="colDate" />,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />
    }
]