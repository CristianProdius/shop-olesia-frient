"use client"

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import Container from "@/components/ui/container";
import Currency from "@/components/ui/currency";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/i18n-content";
import searchProducts from "@/actions/search-products";
import { Product } from "@/types";

interface SearchDialogProps {
    open: boolean;
    onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
    const t = useTranslations("Navbar");
    const locale = useLocale();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Guards against out-of-order responses: only the latest query's results are
    // applied, so a slow earlier fetch can't overwrite a newer one.
    const requestId = useRef(0);

    // Reset transient state whenever the dialog is closed so it reopens clean.
    useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
            setLoading(false);
        }
    }, [open]);

    // Debounced search: wait ~250ms after the last keystroke before fetching.
    useEffect(() => {
        const term = query.trim();
        if (!term) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const id = ++requestId.current;
        const handle = setTimeout(async () => {
            const found = await searchProducts(term);
            if (id === requestId.current) {
                setResults(found);
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(handle);
    }, [query]);

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    const hasQuery = query.trim().length > 0;
    const showEmpty = hasQuery && !loading && results.length === 0;

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
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
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

                            {hasQuery && (
                                <div className="max-h-[70vh] overflow-y-auto pb-6">
                                    {showEmpty ? (
                                        <div className="flex items-center justify-center py-12 text-center">
                                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-strong">
                                                {t("noResults")}
                                            </p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-border">
                                            {results.map((product) => {
                                                const name = localizedField(
                                                    product.nameI18n,
                                                    locale,
                                                    product.name
                                                );
                                                const thumb = product.images?.[0]?.url;
                                                return (
                                                    <li key={product.id}>
                                                        <Link
                                                            href={`/product/${product.id}`}
                                                            onClick={onClose}
                                                            className="flex items-center gap-4 py-3 transition-colors duration-200 hover:bg-placeholder/40 motion-reduce:transition-none"
                                                        >
                                                            <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-placeholder">
                                                                {thumb && (
                                                                    <Image
                                                                        fill
                                                                        src={thumb}
                                                                        alt={name}
                                                                        sizes="48px"
                                                                        className="object-cover"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="product-name truncate">
                                                                    {name}
                                                                </p>
                                                                <div className="mt-1">
                                                                    <Currency value={product.price} />
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </Container>
                    </Dialog.Panel>
                </Transition.Child>
            </Dialog>
        </Transition>
    );
};

export default SearchDialog;
