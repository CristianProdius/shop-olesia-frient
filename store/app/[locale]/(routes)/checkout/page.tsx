"use client"

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import axios from "axios";
import toast from "react-hot-toast";
import Button from "@/components/ui/button";
import Container from "@/components/ui/container";
import Currency from "@/components/ui/currency";
import useCart from "@/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import TrustBadges from "@/components/trust-badges";

const CheckoutPage = () => {
    const t = useTranslations("Cart");
    const locale = useLocale();
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const items = useCart((state) => state.items);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const totalPrice = items.reduce((total, item) => total + Number(item.price), 0);

    // Login required to checkout.
    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/sign-in?redirect=/checkout");
        }
    }, [isPending, session, router]);

    // Prefill name + email from the customer profile when available.
    useEffect(() => {
        if (session?.user?.name) setName(session.user.name);
        if (session?.user?.email) setEmail(session.user.email);
    }, [session]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            toast.error(t("cartEmpty"));
            return;
        }

        setSubmitting(true);
        try {
            // Simulated payment: the admin API creates the order and marks it paid.
            // The cart keeps one line per variant; quantity is 1 per line.
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
                items: items.map((item) => ({
                    productId: item.id,
                    variantId: item.variantId,
                    quantity: 1,
                })),
                customerId: session?.user?.id,
                customerName: name,
                email,
                address,
                phone,
                locale,
            });

            // summary.tsx handles cart clearing + toast on the success param.
            window.location.href = "/cart?success=1";
        } catch (err) {
            // 400 with OUT_OF_STOCK means a variant ran out before checkout.
            if (
                axios.isAxiosError(err) &&
                err.response?.status === 400 &&
                err.response?.data?.error === "OUT_OF_STOCK"
            ) {
                toast.error(t("outOfStockError"));
            } else {
                console.error(err);
                toast.error(t("checkoutFailed"));
            }
            setSubmitting(false);
        }
    };

    if (isPending || !session) {
        return null;
    }

    return (
        <Container>
            <div className="px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold">{t("checkoutTitle")}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {t("simulatedPaymentNotice")}
                </p>

                <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-x-12">
                    <form onSubmit={onSubmit} className="space-y-4 lg:col-span-7">
                        <div className="space-y-1">
                            <label htmlFor="name" className="text-sm font-medium">{t("fullName")}</label>
                            <input id="name" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
                            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="address" className="text-sm font-medium">{t("shippingAddress")}</label>
                            <input id="address" required value={address} onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 border" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="phone" className="text-sm font-medium">{t("phone")}</label>
                            <input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-2 border" />
                        </div>
                        <Button type="submit" disabled={submitting || items.length === 0} className="w-full">
                            {submitting ? t("processing") : t("paySimulated")}
                        </Button>
                    </form>

                    <div className="px-4 py-6 mt-16 bg-gray-50 lg:col-span-5 lg:mt-0 lg:p-8">
                        <h2 className="text-lg font-medium text-gray-900">{t("orderSummary")}</h2>
                        <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-200">
                            <div className="text-base font-medium text-gray-900">{t("orderTotal")}</div>
                            <Currency value={totalPrice} />
                        </div>
                        <div className="pt-6 mt-6 border-t border-border">
                            <TrustBadges />
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default CheckoutPage;
