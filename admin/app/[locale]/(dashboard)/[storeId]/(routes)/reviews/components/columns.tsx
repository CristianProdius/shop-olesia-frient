"use client"
import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';

export type ReviewColumn = {
    id: string
    productId: string
    productName: string
    customerName: string
    rating: number
    status: string
    verified: boolean
    source: string
    createdAt: string
}

const Header = ({ k }: { k: string }) => {
    const t = useTranslations('Reviews');
    return <>{t(k)}</>;
}

const StatusCell = ({ status }: { status: string }) => {
    const t = useTranslations('Reviews');
    const tone =
        status === "approved"
            ? "bg-green-100 text-green-800"
            : status === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800";
    return (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tone}`}>
            {t(`status_${status}`)}
        </span>
    );
}

const RatingCell = ({ rating }: { rating: number }) => {
    const full = "★".repeat(Math.max(0, Math.min(5, rating)));
    const empty = "☆".repeat(Math.max(0, 5 - rating));
    return <span title={`${rating}/5`}>{full}{empty}</span>;
}

const VerifiedCell = ({ verified }: { verified: boolean }) => {
    const t = useTranslations('Reviews');
    return <>{verified ? t('yes') : t('no')}</>;
}

export const columns: ColumnDef<ReviewColumn>[] = [
    {
        accessorKey: 'productName',
        header: () => <Header k="columnProduct" />,
    },
    {
        accessorKey: 'customerName',
        header: () => <Header k="columnCustomer" />,
    },
    {
        accessorKey: 'rating',
        header: () => <Header k="columnRating" />,
        cell: ({ row }) => <RatingCell rating={row.original.rating} />,
    },
    {
        accessorKey: 'status',
        header: () => <Header k="columnStatus" />,
        cell: ({ row }) => <StatusCell status={row.original.status} />,
    },
    {
        accessorKey: 'verified',
        header: () => <Header k="columnVerified" />,
        cell: ({ row }) => <VerifiedCell verified={row.original.verified} />,
    },
    {
        accessorKey: 'source',
        header: () => <Header k="columnSource" />,
    },
    {
        accessorKey: 'createdAt',
        header: () => <Header k="columnDate" />,
    },
    {
        id: 'actions',
        cell: ({ row }) => <CellAction data={row.original} />
    }
]
