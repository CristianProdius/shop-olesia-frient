"use client"

import { useEffect, useState } from "react";
import { StoreModal } from "./store-modal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    loading
}) => {
    const [isMounted, setIsMounted] = useState(false);
    const t = useTranslations('Modals');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <Modal
            title={t('areYouSure')}
            description={t('actionCannotBeUndone')}
            isOpen={isOpen}
            onClose={onClose}>
                <div className="flex items-center justify-end w-full pt-6 space-x-2">
                    <Button disabled={loading} variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button disabled={loading} variant="destructive" onClick={onConfirm}>
                        {t('continue')}
                    </Button>
                </div>
            </Modal>
    )
}