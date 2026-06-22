"use client"

import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
// import { Billboard } from "@prisma/client"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { OrderColumn, useOrderColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

interface OrderClientProps {
    data: OrderColumn[]
}

export const OrderClient: React.FC<OrderClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();
    const t = useTranslations('Orders');
    const columns = useOrderColumns();
    return (
        <>
            <Heading
                title={t('title', { count: data?.length })}
                description={t('description')}/>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="products" />
        </>
    )
}