"use client"

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Container from "@/components/ui/container";

interface SearchDialogProps {
    open: boolean;
    onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
    const t = useTranslations("Navbar");

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onClose();
    };

    return (
        <Transition show={open} appear as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    appear
                >
                    <div className="fixed inset-0 z-[70] bg-black/40 motion-reduce:transition-none" />
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="-translate-y-full"
                    enterTo="translate-y-0"
                    leave="ease-out duration-300"
                    leaveFrom="translate-y-0"
                    leaveTo="-translate-y-full"
                    appear
                >
                    <Dialog.Panel className="fixed inset-x-0 top-0 z-[80] bg-background shadow-[var(--shadow-overlay)] motion-reduce:transition-none motion-reduce:transform-none">
                        <Container>
                            <form
                                onSubmit={onSubmit}
                                className="flex items-center gap-4 py-4"
                            >
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={t("searchPlaceholder")}
                                    className="h-12 w-full rounded-none border-0 border-b border-border bg-transparent text-base text-text placeholder:text-muted transition-colors duration-200 focus:border-border-strong focus:outline-none motion-reduce:transition-none"
                                />
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label={t("closeSearch")}
                                    className="shrink-0 rounded-none text-text transition-colors duration-200 hover:text-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-border-strong motion-reduce:transition-none"
                                >
                                    <X className="h-5 w-5 stroke-[1.5]" />
                                </button>
                            </form>
                        </Container>
                    </Dialog.Panel>
                </Transition.Child>
            </Dialog>
        </Transition>
    );
};

export default SearchDialog;
