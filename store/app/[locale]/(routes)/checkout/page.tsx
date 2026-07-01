"use client"

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
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
    // Guest checkout: no login required. If the shopper is signed in we attach
    // their customerId and prefill their details, but an account is optional.
    const { data: session } = useSession();
    const items = useCart((state) => state.items);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const totalPrice = items.reduce((total, item) => total + Number(item.unitPrice ?? item.price) * (item.quantity ?? 1), 0);

    // Guest checkout: no login required. Prefill name/email from the customer
    // profile when the shopper happens to be signed in.
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
            // The cart keeps one line per variant, each carrying its own quantity.
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
                items: items.map((item) => ({
                    productId: item.id,
                    variantId: item.variantId,
                    quantity: item.quantity ?? 1,
                    unitPrice: item.unitPrice,
                })),
                customerId: session?.user?.id,
                customerName: name,
                email,
                address,
                phone,
                locale,
            });

            // Go to the confirmation page (it clears the cart on arrival).
            const orderId = res.data?.orderId as string | undefined;
            router.push(`/checkout/success${orderId ? `?order=${orderId}` : ""}`);
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

    const labelClass = "uppercase text-xs font-bold tracking-[0.1em] text-muted-strong";
    const inputClass = "w-full border border-border rounded-none h-12 px-3 bg-background text-text focus:border-border-strong focus:outline-none";
    const sectionHeadingClass = "text-sm font-bold uppercase tracking-[0.1em] text-ink";

    return (
        <Container>
            <div className="px-4 py-20 md:py-24 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold uppercase tracking-[0.06em] text-ink pb-6 border-b border-border">
                    {t("checkoutTitle")}
                </h1>
                <p className="mt-4 text-sm text-muted-strong">
                    {t("simulatedPaymentNotice")}
                </p>

                <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-x-12">
                    <form onSubmit={onSubmit} className="space-y-10 lg:col-span-7">
                        {!session && (
                            <p className="text-xs text-muted-strong">
                                {t("haveAccount")}{" "}
                                <Link href="/sign-in?redirect=/checkout" className="text-ink underline underline-offset-4">
                                    {t("signIn")}
                                </Link>
                            </p>
                        )}
                        <section className="space-y-4">
                            <h2 className={sectionHeadingClass}>{t("fullName")}</h2>
                            <div className="space-y-1">
                                <label htmlFor="name" className={labelClass}>{t("fullName")}</label>
                                <input id="name" required value={name} onChange={(e) => setName(e.target.value)}
                                    className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="email" className={labelClass}>{t("email")}</label>
                                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass} />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="phone" className={labelClass}>
                                    {t("phone")} <span className="font-normal lowercase tracking-normal text-muted">({t("optional")})</span>
                                </label>
                                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    className={inputClass} />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className={sectionHeadingClass}>{t("shippingAddress")}</h2>
                            <div className="space-y-1">
                                <label htmlFor="address" className={labelClass}>{t("shippingAddress")}</label>
                                <input id="address" required value={address} onChange={(e) => setAddress(e.target.value)}
                                    className={inputClass} />
                            </div>
                        </section>

                        <Button type="submit" variant="primary" size="lg" disabled={submitting || items.length === 0} className="w-full">
                            {submitting ? t("processing") : t("paySimulated")}
                        </Button>
                    </form>

                    <div className="mt-16 rounded-none bg-surface-2 p-6 lg:col-span-5 lg:mt-0">
                        <h2 className={sectionHeadingClass}>{t("orderSummary")}</h2>
                        <div className="flex items-center justify-between pt-4 mt-6 border-t border-border">
                            <div className="text-base font-bold uppercase tracking-[0.1em] text-ink">{t("orderTotal")}</div>
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
