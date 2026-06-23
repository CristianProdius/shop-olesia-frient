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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatter, cn } from "@/lib/utils";
import { ORDER_STATUSES, getStatusBadgeClass } from "../../components/status";

interface OrderItemData {
    id: string;
    productName: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

interface OrderDetailData {
    id: string;
    customerName: string;
    email: string;
    phone: string;
    address: string;
    locale: string;
    isPaid: boolean;
    status: string;
    carrier: string;
    trackingNumber: string;
    items: OrderItemData[];
    total: number;
}

interface OrderDetailProps {
    initialData: OrderDetailData;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ initialData }) => {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations("Orders");

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(initialData.status);
    const [carrier, setCarrier] = useState(initialData.carrier);
    const [trackingNumber, setTrackingNumber] = useState(
        initialData.trackingNumber
    );

    const onSave = async () => {
        try {
            setLoading(true);
            await axios.patch(
                `/api/${params.storeId}/orders/${initialData.id}`,
                { status, carrier, trackingNumber }
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
                    title={t("orderDetail")}
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
                                {t("customer")}:{" "}
                            </span>
                            {initialData.customerName || "—"}
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
                                {t("address")}:{" "}
                            </span>
                            {initialData.address || "—"}
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                {t("locale")}:{" "}
                            </span>
                            {initialData.locale}
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                {t("paid")}:{" "}
                            </span>
                            {initialData.isPaid ? t("yes") : t("no")}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("fulfillment")}</CardTitle>
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
                                    {ORDER_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {t(`status.${s}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                {t("carrier")}
                            </label>
                            <Input
                                value={carrier}
                                disabled={loading}
                                placeholder={t("carrierPlaceholder")}
                                onChange={(e) => setCarrier(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">
                                {t("trackingNumber")}
                            </label>
                            <Input
                                value={trackingNumber}
                                disabled={loading}
                                placeholder={t("trackingNumberPlaceholder")}
                                onChange={(e) =>
                                    setTrackingNumber(e.target.value)
                                }
                            />
                        </div>
                        <Button disabled={loading} onClick={onSave}>
                            {t("save")}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("items")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("products")}</TableHead>
                                <TableHead>{t("variant")}</TableHead>
                                <TableHead>{t("quantity")}</TableHead>
                                <TableHead>{t("unitPrice")}</TableHead>
                                <TableHead>{t("lineTotal")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>
                                        {item.variantId || "—"}
                                    </TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                        {formatter.format(item.unitPrice)}
                                    </TableCell>
                                    <TableCell>
                                        {formatter.format(item.lineTotal)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-right font-medium"
                                >
                                    {t("totalPrice")}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {formatter.format(initialData.total)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
};
