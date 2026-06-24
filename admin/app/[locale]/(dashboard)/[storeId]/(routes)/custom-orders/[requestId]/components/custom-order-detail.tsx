"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CUSTOM_ORDER_STATUSES, getStatusBadgeClass } from "../../components/status";

interface CustomOrderDetailData {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    measurements: string;
    locale: string;
    status: string;
}

interface CustomOrderDetailProps {
    initialData: CustomOrderDetailData;
}

export const CustomOrderDetail: React.FC<CustomOrderDetailProps> = ({
    initialData,
}) => {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations("CustomOrders");

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(initialData.status);

    const onSave = async () => {
        try {
            setLoading(true);
            await axios.patch(
                `/api/${params.storeId}/custom-orders/${initialData.id}`,
                { status }
            );
            router.refresh();
            toast.success(t("updatedToast"));
        } catch {
            toast.error(t("somethingWentWrong"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={t("requestDetail")}
                    description={initialData.id}
                />
                <Badge className={cn("text-sm", getStatusBadgeClass(status))}>
                    {t(`status.${status}`)}
                </Badge>
            </div>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("customer")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                {t("name")}:{" "}
                            </span>
                            {initialData.name || "—"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                {t("email")}:{" "}
                            </span>
                            {initialData.email || "—"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                {t("phone")}:{" "}
                            </span>
                            {initialData.phone || "—"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                {t("locale")}:{" "}
                            </span>
                            {initialData.locale}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("manage")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                {t("statusLabel")}
                            </label>
                            <Select
                                value={status}
                                onValueChange={setStatus}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CUSTOM_ORDER_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {t(`status.${s}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button disabled={loading} onClick={onSave}>
                            {t("save")}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("message")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                        {initialData.message || "—"}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("measurements")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                        {initialData.measurements || "—"}
                    </p>
                </CardContent>
            </Card>
        </>
    );
};
