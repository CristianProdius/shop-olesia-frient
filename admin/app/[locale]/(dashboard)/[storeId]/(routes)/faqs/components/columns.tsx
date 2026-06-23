"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type FaqColumn = {
    id: string
    question: string
    category: string
    order: number
    isPublished: boolean
    createdAt: string
}

const QuestionHeader = () => {
    const t = useTranslations('Faqs');
    return <>{t('columnQuestion')}</>;
}

const CategoryHeader = () => {
    const t = useTranslations('Faqs');
    return <>{t('columnCategory')}</>;
}

const OrderHeader = () => {
    const t = useTranslations('Faqs');
    return <>{t('columnOrder')}</>;
}

const PublishedHeader = () => {
    const t = useTranslations('Faqs');
    return <>{t('columnPublished')}</>;
}

const DateHeader = () => {
    const t = useTranslations('Faqs');
    return <>{t('columnDate')}</>;
}

const PublishedCell = ({ value }: { value: boolean }) => {
    const t = useTranslations('Faqs');
    return (
        <span className={value ? 'text-green-600' : 'text-muted-foreground'}>
            {value ? t('published') : t('draft')}
        </span>
    );
}

export const columns: ColumnDef<FaqColumn>[] = [
    {
        accessorKey: 'question',
        header: () => <QuestionHeader />,
    },
    {
        accessorKey: 'category',
        header: () => <CategoryHeader />,
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
