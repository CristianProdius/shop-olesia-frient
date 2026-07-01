import { cn } from "@/lib/utils";

type Props = {
  value: number;
  className?: string;
};

/**
 * Five-star row with `value` (0–5) rounded to whole stars lit. Decorative —
 * expose the numeric value via a label on the surrounding element.
 */
const Stars = ({ value, className }: Props) => {
  const rounded = Math.round(value);
  return (
    <span aria-hidden="true" className={cn("text-ink", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rounded ? "text-ink" : "text-border"}>
          ★
        </span>
      ))}
    </span>
  );
};

export default Stars;
