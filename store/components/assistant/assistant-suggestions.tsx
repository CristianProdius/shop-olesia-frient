"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  onSelect: (value: string) => void;
};

const AssistantSuggestions = ({ onSelect }: Props) => {
  const t = useTranslations("Assistant");
  const suggestions = [
    t("suggestDress"),
    t("suggestSizes"),
    t("suggestCare"),
    t("suggestOrder"),
    t("suggestCustom"),
  ];

  return (
    <ul className="flex flex-col gap-2">
      {suggestions.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            onClick={() => onSelect(suggestion)}
            className="group flex w-full items-center justify-between gap-3 border border-border px-3 py-3 text-left text-sm text-text transition-colors duration-200 ease-out hover:border-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
          >
            <span className="text-pretty">{suggestion}</span>
            <ArrowUpRight
              className="size-4 shrink-0 text-muted-strong transition-colors duration-200 ease-out group-hover:text-ink motion-reduce:transition-none"
              aria-hidden="true"
            />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default AssistantSuggestions;
