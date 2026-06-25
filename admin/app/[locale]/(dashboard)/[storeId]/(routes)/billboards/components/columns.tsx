"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type BillboardColumn = {
    id: string
    label: string
    createdAt: string
}

const LabelHeader = () => {
    const t = useTranslations('Billboards');
    return <>{t('columnLabel')}</>;
}

const DateHeader = () => {
    const t = useTranslations('Billboards');
    return <>{t('columnDate')}</>;
}

export const columns: ColumnDef<BillboardColumn>[] = [
    {
        accessorKey: 'label',
        header: () => <LabelHeader />,
    },
    {
        accessorKey: 'createdAt',
        header: () => <DateHeader />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.createdAt}</span>,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />
    }
]