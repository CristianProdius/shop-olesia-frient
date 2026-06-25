"use client";

import { useState } from "react";
import { Category, Color, Size } from '@/types'
import Button from "@/components/ui/button";
import { X } from "lucide-react";
import { Dialog } from "@headlessui/react";
import IconButton from "@/components/ui/icon-button";
import Filter from "./filter";
import CategorySidebar from "./category-sidebar";
import { useTranslations } from "next-intl";

interface MobileFiltersProps {
    sizes: Size[];
    colors: Color[];
    categories: Category[];
    activeCategoryId: string;
    sizesLabel: string;
    colorsLabel: string;
    locale: string;
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
    sizes,
    colors,
    categories,
    activeCategoryId,
    sizesLabel,
    colorsLabel,
    locale,
}) => {
    const t = useTranslations("CategoryPage");
    const [open, setOpen] = useState(false);
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);

    return (
        <>
            <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                onClick={onOpen}
            >
                {t("filters")}
            </Button>
            <Dialog open={open} as="div" className="relative z-40 lg:hidden" onClose={onClose}>
                {/* Background */}
                <div className="fixed inset-0 bg-black/40" aria-hidden />
                {/* Dialog Position */}
                <div className="fixed inset-0 z-40 flex">
                    <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto rounded-none bg-white py-4 pb-6 shadow-[var(--shadow-overlay)]">
                        {/* Close Button */}
                        <div className="flex items-center justify-end px-4">
                            <IconButton icon={<X size={15} onClick={onClose} />} />
                        </div>
                        {/* Render the filters */}
                        <div className="p-4">
                            <div className="mb-8">
                                <CategorySidebar
                                    categories={categories}
                                    activeCategoryId={activeCategoryId}
                                    heading={t("categories")}
                                    locale={locale}
                                />
                            </div>
                            <Filter valueKey="sizeId" name={sizesLabel} data={sizes} locale={locale} />
                            <Filter valueKey="colorId" name={colorsLabel} data={colors} locale={locale} />
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
     );
}

export default MobileFilters;
