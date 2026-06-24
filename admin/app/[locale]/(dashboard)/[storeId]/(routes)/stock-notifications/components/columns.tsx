"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type StockNotificationColumn = {
    id: string
    email: string
    variantId: string
    variantLabel: string
    locale: string
    notified: boolean
    createdAt: string
}

const EmailHeader = () => {
    const t = useTranslations('StockNotifications');
    return <>{t('email')}</>;
}

const VariantHeader = () => {
    const t = useTranslations('StockNotifications');
    return <>{t('variant')}</>;
}

const LocaleHeader = () => {
    const t = useTranslations('StockNotifications');
    return <>{t('locale')}</>;
}

const StatusHeader = () => {
    const t = useTranslations('StockNotifications');
    return <>{t('status')}</>;
}

const DateHeader = () => {
    const t = useTranslations('StockNotifications');
    return <>{t('createdAt')}</>;
}

const NotifiedBadge = ({ notified }: { notified: boolean }) => {
    const t = useTranslations('StockNotifications');
    return (
        <span
            className={
                notified
                    ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            }
        >
            {notified ? t('notified') : t('pending')}
        </span>
    );
}

export const columns: ColumnDef<StockNotificationColumn>[] = [
    {
        accessorKey: 'email',
        header: () => <EmailHeader />,
    },
    {
        accessorKey: 'variantLabel',
        header: () => <VariantHeader />,
    },
    {
        accessorKey: 'locale',
        header: () => <LocaleHeader />,
    },
    {
        accessorKey: 'notified',
        header: () => <StatusHeader />,
        cell: ({ row }) => <NotifiedBadge notified={row.original.notified} />,
    },
    {
        accessorKey: 'createdAt',
        header: () => <DateHeader />,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />,
    },
]
