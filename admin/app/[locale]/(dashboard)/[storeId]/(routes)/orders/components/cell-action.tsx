"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderColumn } from "./columns";
import { Button } from "@/components/ui/button";
import { Copy, Eye, MoreHorizontal } from "lucide-react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface CellActionProps {
    data: OrderColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const router = useRouter();
    const params = useParams();
    const t = useTranslations("Orders");

    const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success(t("copiedToClipboard"));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-8 h-8 p-0">
                    <span className="sr-only">{t("openMenu")}</span>
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onCopy(data.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    {t("copyId")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() =>
                        router.push(`/${params.storeId}/orders/${data.id}`)
                    }
                >
                    <Eye className="w-4 h-4 mr-2" />
                    {t("view")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
