"use client"

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import axios from "axios";
import toast from "react-hot-toast";
import Button from "@/components/ui/button";
import Container from "@/components/ui/container";
import Currency from "@/components/ui/currency";
import useCart from "@/hooks/use-cart";
import { useSession } from "@/lib/auth-client";

const CheckoutPage = () => {
    const t = useTranslations("Cart");
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const items = useCart((state) => state.items);

    const [name, setName] = useState("");
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

    // Prefill name from the customer profile when available.
    useEffect(() => {
        if (session?.user?.name) setName(session.user.name);
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
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
                productIds: items.map((item) => item.id),
                customerId: session?.user?.id,
                name,
                address,
                phone,
            });

            // summary.tsx handles cart clearing + toast on the success param.
            window.location.href = "/cart?success=1";
        } catch (err) {
            console.error(err);
            toast.error(t("checkoutFailed"));
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
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="address" className="text-sm font-medium">{t("shippingAddress")}</label>
                            <input id="address" required value={address} onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="phone" className="text-sm font-medium">{t("phone")}</label>
                            <input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full p-2 border rounded-md" />
                        </div>
                        <Button type="submit" disabled={submitting || items.length === 0} className="w-full">
                            {submitting ? t("processing") : t("paySimulated")}
                        </Button>
                    </form>

                    <div className="px-4 py-6 mt-16 rounded-lg bg-gray-50 lg:col-span-5 lg:mt-0 lg:p-8">
                        <h2 className="text-lg font-medium text-gray-900">{t("orderSummary")}</h2>
                        <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-200">
                            <div className="text-base font-medium text-gray-900">{t("orderTotal")}</div>
                            <Currency value={totalPrice} />
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default CheckoutPage;
