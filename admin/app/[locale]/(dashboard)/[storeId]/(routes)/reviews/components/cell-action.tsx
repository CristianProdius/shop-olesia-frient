"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ReviewColumn } from "./columns"
import { Button } from "@/components/ui/button"
import { Check, Copy, MoreHorizontal, Trash, X } from "lucide-react"
import { toast } from "react-hot-toast"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import axios from "axios"
import { AlertModal } from "@/components/modals/alert-modal"

interface CellActionProps {
    data: ReviewColumn
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {

    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const router = useRouter();
    const params = useParams();
    const t = useTranslations('Reviews');

    const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success(t('copiedToClipboard'))
    }

    const onSetStatus = async (status: "approved" | "rejected") => {
        try {
            setLoading(true);
            await axios.patch(`/api/${params.storeId}/reviews/${data.id}`, { status })
            router.refresh();
            toast.success(status === "approved" ? t('approvedSuccess') : t('rejectedSuccess'))
        } catch {
            toast.error(t('somethingWentWrong'));
        } finally {
            setLoading(false);
        }
    }

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/reviews/${data.id}`)
            router.refresh();
            toast.success(t('deletedSuccess'))
        } catch {
            toast.error(t('deleteError'));
        } finally {
            setLoading(false);
            setOpen(false);
        }
    }

    return (
        <>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}/>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-8 h-8 p-0">
                        <span className="sr-only">{t('openMenu')}</span>
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                        {t('actions')}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onCopy(data.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        {t('copyId')}
                    </DropdownMenuItem>
                    {data.status !== "approved" && (
                        <DropdownMenuItem onClick={() => onSetStatus("approved")}>
                            <Check className="w-4 h-4 mr-2" />
                            {t('approve')}
                        </DropdownMenuItem>
                    )}
                    {data.status !== "rejected" && (
                        <DropdownMenuItem onClick={() => onSetStatus("rejected")}>
                            <X className="w-4 h-4 mr-2" />
                            {t('reject')}
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-500" onClick={() => setOpen(true)}>
                        <Trash className="w-4 h-4 mr-2" />
                        {t('delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
