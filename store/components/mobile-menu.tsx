"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Category } from "@/types";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import LanguageSwitcher from "@/components/language-switcher";

interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
    categories: Category[];
}

const MobileMenu: React.FC<MobileMenuProps> = ({ open, onClose, categories }) => {
    const t = useTranslations("Navbar");
    const locale = useLocale();

    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative md:hidden" onClose={onClose}>
                {/* Scrim */}
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity duration-300 ease-out motion-reduce:transition-none"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-300 ease-out motion-reduce:transition-none"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 z-70 bg-black/40" aria-hidden="true" />
                </Transition.Child>

                {/* Panel */}
                <div className="fixed inset-0 z-80 overflow-hidden">
                    <Transition.Child
                        as={Fragment}
                        enter="transition-transform duration-300 ease-out motion-reduce:transition-none"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition-transform duration-300 ease-out motion-reduce:transition-none"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <Dialog.Panel className="fixed inset-y-0 left-0 z-80 flex w-[82%] max-w-[360px] flex-col bg-background shadow-[var(--shadow-overlay)]">
                            {/* Close */}
                            <div className="flex items-center justify-end px-4 h-14">
                                <button
                                    type="button"
                                    aria-label={t("closeMenu")}
                                    onClick={onClose}
                                    className="inline-flex items-center justify-center text-text transition-colors duration-200 ease-out hover:text-muted"
                                >
                                    <X size={22} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Category links */}
                            <nav className="flex flex-1 flex-col gap-y-5 overflow-y-auto px-6 py-4">
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.id}`}
                                        onClick={onClose}
                                        className={cn(
                                            "text-sm font-bold uppercase tracking-[1px] text-text transition-colors duration-200 ease-out hover:text-ink",
                                        )}
                                    >
                                        {localizedField(category.nameI18n, locale, category.name)}
                                    </Link>
                                ))}
                                <Link
                                    href="/blog"
                                    onClick={onClose}
                                    className={cn(
                                        "text-sm font-bold uppercase tracking-[1px] text-text transition-colors duration-200 ease-out hover:text-ink",
                                    )}
                                >
                                    {t("journal")}
                                </Link>
                            </nav>

                            {/* Bottom: language */}
                            <div className="border-t border-border px-6 py-5">
                                <LanguageSwitcher />
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
};

export default MobileMenu;
