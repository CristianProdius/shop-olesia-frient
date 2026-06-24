"use client";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { CustomOrderColumn, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";

interface CustomOrderClientProps {
    data: CustomOrderColumn[];
}

export const CustomOrderClient: React.FC<CustomOrderClientProps> = ({
    data,
}) => {
    const t = useTranslations("CustomOrders");
    return (
        <>
            <Heading
                title={t("title", { count: data?.length })}
                description={t("description")}
            />
            <Separator />
            <DataTable columns={columns} data={data} searchKey="email" />
        </>
    );
};
