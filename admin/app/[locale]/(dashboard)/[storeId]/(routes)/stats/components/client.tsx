"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { StatColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { ApiList } from "@/components/ui/api-list"

interface StatClientProps {
    data: StatColumn[]
}

export const StatClient: React.FC<StatClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();
    const t = useTranslations('Stats');
    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={t('title', { count: data?.length })}
                    description={t('description')}/>
                <Button onClick={() => router.push(`/${params.storeId}/stats/new`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addNew')}
                </Button>
            </div>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="key" />
            <Heading title={t('apiTitle')} description={t('apiDescription')} />
            <Separator />
            <ApiList entityName="stats" entityIdName="statId" />
        </>
    )
}
