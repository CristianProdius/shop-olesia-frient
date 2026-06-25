"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action';

const HeaderCell = ({ id }: { id: string }) => {
    const t = useTranslations('Blog');
    return <>{t(id)}</>;
};

const StatusCell = ({ status }: { status: boolean }) => {
    const t = useTranslations('Blog');
    return (
        <Badge variant={status ? 'default' : 'secondary'}>
            {status ? t('published') : t('draft')}
        </Badge>
    );
};

export type BlogColumn = {
    id: string
    title: string
    status: boolean
    createdAt: string
}

export const columns: ColumnDef<BlogColumn>[] = [
    {
        accessorKey: 'title',
        header: () => <HeaderCell id="colTitle" />,
    },
    {
        accessorKey: 'status',
        header: () => <HeaderCell id="colStatus" />,
        cell: ({ row }) => <StatusCell status={row.original.status} />
    },
    {
        accessorKey: 'createdAt',
        header: () => <HeaderCell id="colDate" />,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />
    }
]
