"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import Container from "@/components/ui/container";
import useCart from "@/hooks/use-cart";

const SuccessContent = () => {
    const t = useTranslations("Cart");
    const searchParams = useSearchParams();
    const removeAll = useCart((state) => state.removeAll);
    const orderId = searchParams.get("order");

    const [isMounted, setIsMounted] = useState(false);

    // Clear the cart once the order is confirmed.
    useEffect(() => {
        removeAll();
        setIsMounted(true);
    }, [removeAll]);

    if (!isMounted) return null;

    return (
        <Container>
            <div className="mx-auto max-w-[560px] px-4 py-28 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-success text-success">
                    <Check size={26} strokeWidth={1.5} />
                </div>
                <h1 className="heading-luxe mt-8 text-2xl text-ink text-balance">
                    {t("orderConfirmedTitle")}
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-strong text-pretty">
                    {t("orderConfirmedBody")}
                </p>

                {orderId && (
                    <p className="mt-8 text-xs uppercase tracking-[0.1em] text-muted-strong">
                        {t("orderReference")}:{" "}
                        <span className="text-text">{orderId.slice(0, 8).toUpperCase()}</span>
                    </p>
                )}

                <Link
                    href="/"
                    className="mt-10 inline-flex items-center justify-center border border-ink bg-ink px-9 py-4 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-transparent hover:text-ink"
                >
                    {t("backToShop")}
                </Link>
            </div>
        </Container>
    );
};

const CheckoutSuccessPage = () => (
    <Suspense fallback={null}>
        <SuccessContent />
    </Suspense>
);

export default CheckoutSuccessPage;
