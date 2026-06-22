"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
// import { Billboard } from "@prisma/client"
import { Plus } from "lucide-react"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { ColorColumn, useColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { ApiList } from "@/components/ui/api-list"

interface ColorClientProps {
    data: ColorColumn[]
}

export const ColorClient: React.FC<ColorClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();
    const t = useTranslations('Colors');
    const columns = useColumns();
    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={t('title', { count: data?.length })}
                    description={t('description')}/>
                <Button onClick={() => router.push(`/${params.storeId}/colors/new`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addNew')}
                </Button>
            </div>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="name" />
            <Heading title={t('apiTitle')} description={t('apiDescription')} />
            <Separator />
            <ApiList entityName="colors" entityIdName="colorId" />
        </>
    )
}