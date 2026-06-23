import { cn } from "@/lib/utils";

interface WordmarkProps {
    className?: string;
}

// LILETTI brand wordmark. Rendered literally (NOT i18n) — brand text.
const Wordmark = ({ className }: WordmarkProps) => {
    return (
        <span
            className={cn(
                "font-bold uppercase tracking-[0.2em] text-ink",
                className
            )}
        >
            LILETTI
        </span>
    );
};

export default Wordmark;
