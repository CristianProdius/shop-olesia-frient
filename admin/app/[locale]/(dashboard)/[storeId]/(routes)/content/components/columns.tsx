"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type ContentColumn = {
    id: string
    type: string
    heading: string
    order: number
    isPublished: boolean
    createdAt: string
}

const TypeHeader = () => {
    const t = useTranslations('Content');
    return <>{t('columnType')}</>;
}

const HeadingHeader = () => {
    const t = useTranslations('Content');
    return <>{t('columnHeading')}</>;
}

const OrderHeader = () => {
    const t = useTranslations('Content');
    return <>{t('columnOrder')}</>;
}

const PublishedHeader = () => {
    const t = useTranslations('Content');
    return <>{t('columnPublished')}</>;
}

const DateHeader = () => {
    const t = useTranslations('Content');
    return <>{t('columnDate')}</>;
}

const PublishedCell = ({ value }: { value: boolean }) => {
    const t = useTranslations('Content');
    return (
        <span className={value ? 'text-green-600' : 'text-muted-foreground'}>
            {value ? t('published') : t('draft')}
        </span>
    );
}

export const columns: ColumnDef<ContentColumn>[] = [
    {
        accessorKey: 'type',
        header: () => <TypeHeader />,
    },
    {
        accessorKey: 'heading',
        header: () => <HeadingHeader />,
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
