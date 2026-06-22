"use client";

import React, { useState } from "react";
import { Store } from "@prisma/client";
import { Check, ChevronsUpDown, PlusCircle, Store as StoreIcon} from "lucide-react";
import { useStoreModal } from "@/hooks/use-store-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button }  from "./ui/button";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "./ui/command";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface StoreSwitcherProps extends PopoverTriggerProps {
    items: Store[];
}
export default function StoreSwitcher({
    className,
    items = []
}: StoreSwitcherProps) {
    const storeModal = useStoreModal();
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('StoreSwitcher');

    const formattedItems = items.map((item) => ({
        label: item.name,
        value: item.id
    }));

    const currentStore = formattedItems.find((item) => item.value === params.storeId)

    const [open, setOpen] = useState(false);

    const onStoreSelect = (store: { value: string, label: string }) => {
        setOpen(true);
        router.push(`/${store.value}`)
    }
    return (
        <Popover onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" role="combobox" aria-expanded={open} aria-label={t('selectStore')} className={cn("w-[200px] justify-between", className)}>
                    <StoreIcon className="w-4 h-4 mr-2" />
                        {currentStore?.label}
                    <ChevronsUpDown className="w-4 h-4 ml-auto opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder={t('searchStore')} />
                        <CommandEmpty>{t('noStoreFound')}</CommandEmpty>
                        <CommandGroup heading={t('stores')}>
                            {formattedItems.map((store, index) =>(
                                <CommandItem key={index} onSelect={() => onStoreSelect(store)} className="text-sm">
                                    <StoreIcon className="w-4 h-4 mr-2" />
                                    {store.label}
                                    <Check className={cn("ml-auto h-4 w-4", currentStore?.value === store.value ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                    <CommandList>
                        <CommandGroup>
                            <CommandItem onSelect={() => {
                                setOpen(false); storeModal.onOpen();
                            }}>
                                <PlusCircle className="w-5 h-5 mr-2" />
                                {t('createStore')}
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}