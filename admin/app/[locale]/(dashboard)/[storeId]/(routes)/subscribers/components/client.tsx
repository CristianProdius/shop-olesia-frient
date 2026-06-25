"use client"

import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { useTranslations } from "next-intl"
import { columns, SubscriberColumn } from "./columns"
import { DataTable } from "@/components/ui/data-table"

interface SubscriberClientProps {
    data: SubscriberColumn[]
}

export const SubscriberClient: React.FC<SubscriberClientProps> = ({
    data
}) => {
    const t = useTranslations('Subscribers');
    return (
        <>
            <Heading
                title={t('title', { count: data?.length })}
                description={t('description')}/>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="email" />
        </>
    )
}
