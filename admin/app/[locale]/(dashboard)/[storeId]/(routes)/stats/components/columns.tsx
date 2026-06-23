"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type StatColumn = {
    id: string
    key: string
    label: string
    value: string
    order: number
    isPublished: boolean
    createdAt: string
}

const KeyHeader = () => {
    const t = useTranslations('Stats');
    return <>{t('columnKey')}</>;
}

const LabelHeader = () => {
    const t = useTranslations('Stats');
    return <>{t('columnLabel')}</>;
}

const ValueHeader = () => {
    const t = useTranslations('Stats');
    return <>{t('columnValue')}</>;
}

const OrderHeader = () => {
    const t = useTranslations('Stats');
    return <>{t('columnOrder')}</>;
}

const PublishedHeader = () => {
    const t = useTranslations('Stats');
    return <>{t('columnPublished')}</>;
}

const DateHeader = () => {
    const t = useTranslations('Stats');
    return <>{t('columnDate')}</>;
}

const PublishedCell = ({ value }: { value: boolean }) => {
    const t = useTranslations('Stats');
    return (
        <span className={value ? 'text-green-600' : 'text-muted-foreground'}>
            {value ? t('published') : t('draft')}
        </span>
    );
}

export const columns: ColumnDef<StatColumn>[] = [
    {
        accessorKey: 'key',
        header: () => <KeyHeader />,
    },
    {
        accessorKey: 'label',
        header: () => <LabelHeader />,
    },
    {
        accessorKey: 'value',
        header: () => <ValueHeader />,
    },
    {
        accessorKey: 'order',
        header: () => <OrderHeader />,
    },
    {
        accessorKey: 'isPublished',
        header: () => <PublishedHeader />,
        cell: ({ row }) => <PublishedCell value={row.original.isPublished} />
    },
    {
        accessorKey: 'createdAt',
        header: () => <DateHeader />,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />
    }
]
