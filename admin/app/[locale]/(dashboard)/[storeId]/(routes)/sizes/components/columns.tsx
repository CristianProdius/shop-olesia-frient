"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type SizeColumn = {
    id: string
    name: string
    value: string
    createdAt: string
}

export const useColumns = (): ColumnDef<SizeColumn>[] => {
    const t = useTranslations('Sizes');
    return [
        {
            accessorKey: 'name',
            header: t('columnName'),
        },
        {
            accessorKey: 'value',
            header: t('columnValue'),
        },
        {
            accessorKey: 'createdAt',
            header: t('columnDate'),
        },
        {
            id: 'actions',
            cell: ({ row }) => <CellAction data={row.original} />
        }
    ]
}