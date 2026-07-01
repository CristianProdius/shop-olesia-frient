"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import AssistantDrawer from "./assistant-drawer";

const AssistantLauncher = () => {
  const t = useTranslations("Assistant");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-[calc(1.25rem+env(safe-area-inset-right))] z-[90] flex size-12 items-center justify-center border border-ink bg-ink text-white shadow-[var(--shadow-overlay)] transition-colors duration-200 ease-out hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
      >
        <MessageCircle className="size-5 stroke-[1.5]" aria-hidden="true" />
      </button>
      <AssistantDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AssistantLauncher;
