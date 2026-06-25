"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

export type SubscriberColumn = {
    id: string
    email: string
    createdAt: string
}

const HeaderCell = ({ id }: { id: string }) => {
    const t = useTranslations('Subscribers');
    return <>{t(id)}</>;
};

export const columns: ColumnDef<SubscriberColumn>[] = [
    {
        accessorKey: 'email',
        header: () => <HeaderCell id="columnEmail" />,
    },
    {
        accessorKey: 'createdAt',
        header: () => <HeaderCell id="columnDate" />,
    },
]
