"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type SizeGuideColumn = {
    id: string
    title: string
    category: string
    order: number
    isPublished: boolean
    createdAt: string
}

const CategoryHeader = () => {
    const t = useTranslations('SizeGuides');
    return <>{t('columnCategory')}</>;
}

const TitleHeader = () => {
    const t = useTranslations('SizeGuides');
    return <>{t('columnTitle')}</>;
}

const OrderHeader = () => {
    const t = useTranslations('SizeGuides');
    return <>{t('columnOrder')}</>;
}

const PublishedHeader = () => {
    const t = useTranslations('SizeGuides');
    return <>{t('columnPublished')}</>;
}

const DateHeader = () => {
    const t = useTranslations('SizeGuides');
    return <>{t('columnDate')}</>;
}

const PublishedCell = ({ value }: { value: boolean }) => {
    const t = useTranslations('SizeGuides');
    return (
        <span className={value ? 'text-green-600' : 'text-muted-foreground'}>
            {value ? t('published') : t('draft')}
        </span>
    );
}

export const columns: ColumnDef<SizeGuideColumn>[] = [
    {
        accessorKey: 'category',
        header: () => <CategoryHeader />,
    },
    {
        accessorKey: 'title',
        header: () => <TitleHeader />,
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
