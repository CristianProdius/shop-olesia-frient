"use client"

import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { useTranslations } from "next-intl"
import { StockNotificationColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

interface StockNotificationClientProps {
    data: StockNotificationColumn[]
}

export const StockNotificationClient: React.FC<StockNotificationClientProps> = ({
    data
}) => {
    const t = useTranslations('StockNotifications');

    return (
        <>
            <Heading
                title={t('title', { count: data?.length })}
                description={t('description')} />
            <Separator />
            <DataTable columns={columns} data={data} searchKey="email" />
        </>
    )
}
