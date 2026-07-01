"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import useCart from "@/hooks/use-cart";
import useCartDrawer from "@/hooks/use-cart-drawer";
import { useRouter, Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import Currency from "@/components/ui/currency";

const CartDrawer = () => {
    const t = useTranslations("Cart");
    const locale = useLocale();
    const router = useRouter();

    const { isOpen, onClose } = useCartDrawer();
    const items = useCart((state) => state.items);
    const removeItem = useCart((state) => state.removeItem);
    const updateQuantity = useCart((state) => state.updateQuantity);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const total = items.reduce(
        (sum, item) => sum + Number(item.unitPrice ?? item.price) * (item.quantity ?? 1),
        0,
    );

    const onCheckout = () => {
        onClose();
        router.push("/checkout");
    };

    if (!isMounted) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[80]" onClose={onClose}>
                {/* Scrim */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 z-[70] bg-black/40" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 z-[80] overflow-hidden">
                    <div className="absolute inset-0 flex justify-end">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <Dialog.Panel className="flex h-full w-[90%] max-w-[420px] flex-col bg-background shadow-[var(--shadow-overlay)]">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                                    <Dialog.Title className="heading-luxe text-sm text-ink">
                                        {t("yourBag")}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label={t("close")}
                                        className="flex size-9 items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted"
                                    >
                                        <X size={18} strokeWidth={1.5} />
                                    </button>
                                </div>

                                {/* Items */}
                                {items.length === 0 ? (
                                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center animate-drawer-in">
                                        <p className="text-sm text-muted-strong">{t("empty")}</p>
                                        <Link
                                            href="/"
                                            onClick={onClose}
                                            className="text-xs font-bold uppercase tracking-[0.1em] text-ink underline-offset-4 hover:underline"
                                        >
                                            {t("continueShopping")}
                                        </Link>
                                    </div>
                                ) : (
                                    <ul className="flex-1 divide-y divide-border overflow-y-auto px-6 animate-drawer-in">
                                        {items.map((item) => {
                                            const lineId = item.variantId ?? item.id;
                                            const name = localizedField(item.nameI18n, locale, item.name);
                                            const quantity = item.quantity ?? 1;
                                            const lineSubtotal = Number(item.unitPrice ?? item.price) * quantity;
                                            return (
                                            <li key={lineId} className="flex gap-4 py-5">
                                                <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-placeholder">
                                                    <Image
                                                        fill
                                                        src={item.images?.[0]?.url}
                                                        alt={name}
                                                        sizes="64px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-1 flex-col">
                                                    <p className="text-sm text-text">
                                                        {name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-strong">
                                                        {localizedField((item.selectedColor ?? item.color)?.nameI18n, locale, (item.selectedColor ?? item.color)?.name)}
                                                        {" · "}
                                                        {localizedField((item.selectedSize ?? item.size)?.nameI18n, locale, (item.selectedSize ?? item.size)?.name)}
                                                    </p>
                                                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                                                        <div className="inline-flex items-center border border-border">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(lineId, quantity - 1)}
                                                                disabled={quantity <= 1}
                                                                aria-label={t("decreaseQuantity")}
                                                                className="flex size-8 items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted disabled:opacity-40 disabled:hover:text-text"
                                                            >
                                                                <Minus size={14} strokeWidth={1.5} />
                                                            </button>
                                                            <span className="min-w-7 text-center text-xs tabular-nums text-text">
                                                                {quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(lineId, quantity + 1)}
                                                                aria-label={t("increaseQuantity")}
                                                                className="flex size-8 items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted"
                                                            >
                                                                <Plus size={14} strokeWidth={1.5} />
                                                            </button>
                                                        </div>
                                                        <div className="text-sm text-text">
                                                            <Currency value={lineSubtotal} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(lineId)}
                                                    aria-label={t("remove")}
                                                    className="flex size-8 shrink-0 items-center justify-center self-start text-text transition-colors duration-200 ease-out hover:text-muted"
                                                >
                                                    <X size={15} strokeWidth={1.5} />
                                                </button>
                                            </li>
                                            );
                                        })}
                                    </ul>
                                )}

                                {/* Footer */}
                                {items.length > 0 && (
                                    <div className="border-t border-border bg-surface-2 px-6 py-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
                                                {t("subtotal")}
                                            </span>
                                            <span className="text-base text-ink">
                                                <Currency value={total} />
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onCheckout}
                                            className="mt-5 w-full border border-ink bg-ink px-9 py-4 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 ease-out hover:bg-transparent hover:text-ink"
                                        >
                                            {t("checkout")}
                                        </button>
                                        <Link
                                            href="/cart"
                                            onClick={onClose}
                                            className="mt-3 block w-full border border-border-strong px-9 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:bg-ink hover:text-white"
                                        >
                                            {t("viewCart")}
                                        </Link>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CartDrawer;
