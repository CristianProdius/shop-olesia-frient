"use client";

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
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="border border-border px-3 py-2 text-left text-xs text-text transition-colors duration-200 ease-out hover:border-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-border-strong motion-reduce:transition-none"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default AssistantSuggestions;
