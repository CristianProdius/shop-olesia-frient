"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStatusBadgeClass } from "./status";
import { CellAction } from "./cell-action";

export type CustomOrderColumn = {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
};

const NameHeader = () => {
    const t = useTranslations("CustomOrders");
    return <>{t("name")}</>;
};

const EmailHeader = () => {
    const t = useTranslations("CustomOrders");
    return <>{t("email")}</>;
};

const StatusHeader = () => {
    const t = useTranslations("CustomOrders");
    return <>{t("statusLabel")}</>;
};

const DateHeader = () => {
    const t = useTranslations("CustomOrders");
    return <>{t("createdAt")}</>;
};

const StatusCell = ({ status }: { status: string }) => {
    const t = useTranslations("CustomOrders");
    return (
        <Badge className={cn("text-sm", getStatusBadgeClass(status))}>
            {t(`status.${status}`)}
        </Badge>
    );
};

export const columns: ColumnDef<CustomOrderColumn>[] = [
    {
        accessorKey: "name",
        header: () => <NameHeader />,
    },
    {
        accessorKey: "email",
        header: () => <EmailHeader />,
    },
    {
        accessorKey: "status",
        header: () => <StatusHeader />,
        cell: ({ row }) => <StatusCell status={row.original.status} />,
    },
    {
        accessorKey: "createdAt",
        header: () => <DateHeader />,
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
