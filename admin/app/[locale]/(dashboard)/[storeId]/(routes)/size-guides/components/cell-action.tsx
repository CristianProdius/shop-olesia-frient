"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SizeGuideColumn } from "./columns"
import { Button } from "@/components/ui/button"
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react"
import { toast } from "react-hot-toast"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import axios from "axios"
import { AlertModal } from "@/components/modals/alert-modal"

interface CellActionProps {
    data: SizeGuideColumn
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const router = useRouter();
    const params = useParams();
    const t = useTranslations('SizeGuides');

    const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success(t('copiedToClipboard'))
    }

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/size-guides/${data.id}`)
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
                loading={loading} />
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
                    <DropdownMenuItem onClick={() => router.push(`/${params.storeId}/size-guides/${data.id}`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t('update')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={() => setOpen(true)}>
                        <Trash className="w-4 h-4 mr-2" />
                        {t('delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
