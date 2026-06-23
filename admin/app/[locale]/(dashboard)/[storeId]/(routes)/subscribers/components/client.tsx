"use client"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { Download } from "lucide-react"
import { useTranslations } from "next-intl"
import { SubscriberColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"

interface SubscriberClientProps {
    data: SubscriberColumn[]
}

export const SubscriberClient: React.FC<SubscriberClientProps> = ({
    data
}) => {
    const t = useTranslations('Subscribers');

    // Client-side CSV export of the currently loaded rows. Builds a Blob and
    // triggers a download — no server round-trip needed.
    const onDownloadCsv = () => {
        const escape = (value: string) => {
            // Wrap in quotes and escape embedded quotes per RFC 4180.
            return `"${value.replace(/"/g, '""')}"`;
        };

        const header = [t('email'), t('createdAt')].map(escape).join(",");
        const rows = data.map((row) =>
            [row.email, row.createdAt].map(escape).join(",")
        );
        const csv = [header, ...rows].join("\r\n");

        const blob = new Blob([`﻿${csv}`], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "subscribers.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={t('title', { count: data?.length })}
                    description={t('description')} />
                <Button onClick={onDownloadCsv} disabled={data.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('downloadCsv')}
                </Button>
            </div>
            <Separator />
            <DataTable columns={columns} data={data} searchKey="email" />
        </>
    )
}
