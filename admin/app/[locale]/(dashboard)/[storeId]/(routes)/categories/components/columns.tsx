"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type CategoryColumn = {
    id: string
    name: string
    billboardLabel: string
    createdAt: string
}

const HeaderName = () => {
    const t = useTranslations('Categories');
    return <>{t('colName')}</>;
};

const HeaderBillboard = () => {
    const t = useTranslations('Categories');
    return <>{t('colBillboard')}</>;
};

const HeaderDate = () => {
    const t = useTranslations('Categories');
    return <>{t('colDate')}</>;
};

export const columns: ColumnDef<CategoryColumn>[] = [
    {
        accessorKey: 'name',
        header: () => <HeaderName />,
    },
    {
        accessorKey: 'billboard',
        header: () => <HeaderBillboard />,
        cell: ({ row }) => row.original.billboardLabel,
    },
    {
        accessorKey: 'createdAt',
        header: () => <HeaderDate />,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />
    }
]