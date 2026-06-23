"use client";
import { useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { formatCompareAt } from "@/lib/format";

interface CurrencyProps {
  value?: string | number;
  compareAtValue?: string | number;
}

const Currency: React.FC<CurrencyProps> = ({ value, compareAtValue }) => {
  const locale = useLocale();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  const { current, compareAt, onSale } = formatCompareAt(
    Number(value),
    compareAtValue !== undefined ? Number(compareAtValue) : undefined,
    locale
  );

  return (
    <span className="price font-semibold">
      {onSale && (
        <span className="text-muted-strong line-through mr-2 font-normal">{compareAt}</span>
      )}
      <span className={onSale ? "text-sale" : undefined}>{current}</span>
    </span>
  );
};

export default Currency;
