"use client"

import { Button } from "@/components/ui/button"
import { StockNotificationColumn } from "./columns"
import { Bell } from "lucide-react"
import { toast } from "react-hot-toast"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import axios from "axios"

interface CellActionProps {
    data: StockNotificationColumn
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {

    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const params = useParams();
    const t = useTranslations('StockNotifications');

    // Triggers a notify pass for the whole variant (every pending row), not just
    // this single row — that's the natural unit for "back in stock".
    const onNotify = async () => {
        try {
            setLoading(true);
            const { data: res } = await axios.post(
                `/api/${params.storeId}/stock-notifications/notify`,
                { variantId: data.variantId }
            );
            router.refresh();
            toast.success(
                t('notifySuccess', {
                    notified: res?.notified ?? 0,
                    skipped: res?.skipped ?? 0,
                })
            );
        } catch {
            toast.error(t('notifyError'));
        } finally {
            setLoading(false);
        }
    }

    if (data.notified) {
        return null;
    }

    return (
        <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onNotify}
        >
            <Bell className="w-4 h-4 mr-2" />
            {t('notifyNow')}
        </Button>
    )
}
