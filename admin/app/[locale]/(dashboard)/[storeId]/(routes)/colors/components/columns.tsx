"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type ColorColumn = {
    id: string
    name: string
    value: string
    createdAt: string
}

export const useColumns = (): ColumnDef<ColorColumn>[] => {
    const t = useTranslations('Colors');
    return [
        {
            accessorKey: 'name',
            header: t('columnName'),
        },
        {
            accessorKey: 'value',
            header: t('columnValue'),
            cell: ({ row }) => (
                <div className='flex items-center gap-x-2'>
                    {row.original.value}
                    <div className='size-6 border rounded-full' style={{ backgroundColor: row.original.value }} />
                </div>
            )
        },
        {
            accessorKey: 'createdAt',
            header: t('columnDate'),
            cell: ({ row }) => <span className="tabular-nums">{row.original.createdAt}</span>,
        },
        {
            id: 'actions',
            cell: ({ row }) => <CellAction data={row.original} />
        }
    ]
}