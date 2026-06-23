"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

export type SubscriberColumn = {
    id: string
    email: string
    createdAt: string
}

const EmailHeader = () => {
    const t = useTranslations('Subscribers');
    return <>{t('email')}</>;
}

const DateHeader = () => {
    const t = useTranslations('Subscribers');
    return <>{t('createdAt')}</>;
}

export const columns: ColumnDef<SubscriberColumn>[] = [
    {
        accessorKey: 'email',
        header: () => <EmailHeader />,
    },
    {
        accessorKey: 'createdAt',
        header: () => <DateHeader />,
    },
]
