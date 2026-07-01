"use client";

import { useLocale, useTranslations } from "next-intl";

import { localizedField } from "@/lib/i18n-content";
import type { SizeGuide } from "@/types";
import { cn } from "@/lib/utils";

function localizedColumns(guide: SizeGuide, locale: string): string[] {
  const cols = guide.columnsI18n;
  if (cols && typeof cols === "object") {
    const localized = (cols as Record<string, unknown>)[locale];
    if (Array.isArray(localized) && localized.length > 0) {
      return localized.filter((c): c is string => typeof c === "string");
    }
    const fallback = (cols as Record<string, unknown>).en;
    if (Array.isArray(fallback)) {
      return fallback.filter((c): c is string => typeof c === "string");
    }
  }
  return [];
}

type Props = {
  guides: SizeGuide[];
  className?: string;
};

/**
 * Renders published size guides as unobtrusive native <details> disclosures —
 * accessible and JS-free. Each guide shows a localized measurement table.
 */
const SizeGuideTable = ({ guides, className }: Props) => {
  const locale = useLocale();
  const t = useTranslations("Product");

  const usable = (guides ?? []).filter((g) => (g.rows ?? []).length > 0);
  if (usable.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {usable.map((guide) => {
        const columns = localizedColumns(guide, locale);
        const caption = localizedField(guide.titleI18n, locale, guide.title ?? "");
        const rows = guide.rows ?? [];

        return (
          <details key={guide.id} className="border border-border">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-ink transition-colors duration-200 ease-out hover:text-muted motion-reduce:transition-none">
              {caption ? `${t("sizeGuide")} — ${caption}` : t("sizeGuide")}
            </summary>
            <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full border-collapse text-sm">
                {columns.length > 0 && (
                  <thead>
                    <tr className="border-b border-border">
                      {columns.map((col) => (
                        <th
                          key={col}
                          scope="col"
                          className="px-2 py-2 text-left text-xs font-bold uppercase tracking-[0.08em] text-muted-strong"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr
                      key={`${guide.id}-${rowIndex}`}
                      className="border-b border-border last:border-b-0"
                    >
                      <th
                        scope="row"
                        className="px-2 py-2 text-left text-sm font-medium text-ink"
                      >
                        {row.label}
                      </th>
                      {(row.values ?? []).map((value, valueIndex) => (
                        <td
                          key={`${guide.id}-${rowIndex}-${valueIndex}`}
                          className="px-2 py-2 text-sm text-text tabular-nums"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </div>
  );
};

export default SizeGuideTable;
