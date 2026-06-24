"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Container from "@/components/ui/container";
import Currency from "@/components/ui/currency";
import ReviewForm from "@/components/review-form";
import getMyOrders from "@/actions/get-my-orders";
import { useSession } from "@/lib/auth-client";
import { Order } from "@/types";

// Maps an order status to its localized label.
const STATUS_KEYS: Record<string, string> = {
    pending: "statusPending",
    paid: "statusPaid",
    packed: "statusPacked",
    shipped: "statusShipped",
    delivered: "statusDelivered",
    cancelled: "statusCancelled",
};

const AccountPage = () => {
    const t = useTranslations("Account");
    const router = useRouter();
    const { data: session, isPending } = useSession();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    // Per order-line keys (orderId:productId) that were just reviewed, so the
    // line shows a "pending moderation" state without a refetch.
    const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
    // Which order-line keys have their review form open.
    const [openForm, setOpenForm] = useState<Record<string, boolean>>({});

    const customerId = session?.user?.id;
    const customerName = session?.user?.name ?? "";

    // Session guard: redirect to sign-in when there is no customer session.
    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/sign-in?redirect=/account");
        }
    }, [isPending, session, router]);

    // Load this customer's orders once we know who they are.
    useEffect(() => {
        if (!customerId) return;
        let active = true;
        setLoading(true);
        getMyOrders(customerId)
            .then((data) => {
                if (active) setOrders(data);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [customerId]);

    if (isPending || !session) {
        return null;
    }

    return (
        <Container>
            <div className="px-4 py-10 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>

                {loading ? (
                    <p className="text-gray-500">{t("loading")}</p>
                ) : orders.length === 0 ? (
                    <p className="text-gray-500">{t("noOrders")}</p>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order) => {
                            const statusKey = STATUS_KEYS[order.status] ?? "statusPending";
                            const isDelivered = order.status === "delivered";

                            return (
                                <div key={order.id} className="border p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {t("orderNumber")}
                                            </p>
                                            <p className="font-mono text-sm">{order.id}</p>
                                        </div>
                                        <span className="px-3 py-1 text-xs font-semibold bg-black text-white rounded-full">
                                            {t(statusKey)}
                                        </span>
                                    </div>

                                    {order.trackingNumber && (
                                        <p className="text-sm mb-3">
                                            {t("tracking")}: {order.carrier ? `${order.carrier} ` : ""}
                                            <span className="font-mono">{order.trackingNumber}</span>
                                        </p>
                                    )}

                                    <ul className="divide-y border-t border-b">
                                        {order.items.map((item) => {
                                            const key = `${order.id}:${item.productId}`;
                                            return (
                                                <li key={item.id} className="py-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm">
                                                            {item.productName} × {item.quantity}
                                                        </span>
                                                        {item.unitPrice != null && (
                                                            <Currency value={item.unitPrice} />
                                                        )}
                                                    </div>

                                                    {isDelivered && (
                                                        <div>
                                                            {submitted[key] ? (
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    {t("reviewPending")}
                                                                </p>
                                                            ) : openForm[key] ? (
                                                                <ReviewForm
                                                                    productId={item.productId}
                                                                    customerId={customerId ?? ""}
                                                                    customerName={customerName}
                                                                    onSubmitted={() =>
                                                                        setSubmitted((s) => ({
                                                                            ...s,
                                                                            [key]: true,
                                                                        }))
                                                                    }
                                                                />
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setOpenForm((o) => ({
                                                                            ...o,
                                                                            [key]: true,
                                                                        }))
                                                                    }
                                                                    className="mt-2 text-sm underline"
                                                                >
                                                                    {t("leaveReview")}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm font-medium">{t("total")}</span>
                                        <Currency value={order.total} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Container>
    );
};

export default AccountPage;
