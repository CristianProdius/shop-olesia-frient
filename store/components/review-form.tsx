"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import axios from "axios";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
    productId: string;
    customerId: string;
    customerName: string;
    // Called after a successful submit so the parent can switch to a
    // "pending moderation" state for this product line.
    onSubmitted?: () => void;
}

// Verified review submission form. POSTs to the admin public reviews endpoint;
// the server forces status "pending" and computes `verified` itself.
const ReviewForm: React.FC<ReviewFormProps> = ({
    productId,
    customerId,
    customerName,
    onSubmitted,
}) => {
    const t = useTranslations("Account");
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [body, setBody] = useState("");
    const [fitVote, setFitVote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            toast.error(t("ratingRequired"));
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
                productId,
                customerId,
                customerName,
                rating,
                body: body.trim() || undefined,
                fitVote: fitVote || undefined,
            });
            toast.success(t("reviewSubmitted"));
            onSubmitted?.();
        } catch {
            toast.error(t("reviewError"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="mt-3 space-y-3 border-t pt-3">
            <div className="space-y-1">
                <span className="block text-sm font-medium">{t("rating")}</span>
                <div className="flex items-center gap-x-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            onMouseEnter={() => setHover(value)}
                            onMouseLeave={() => setHover(0)}
                            aria-label={`${value}`}
                            className="p-0.5"
                        >
                            <Star
                                size={22}
                                className={cn(
                                    "transition",
                                    (hover || rating) >= value
                                        ? "fill-black text-black"
                                        : "text-gray-300"
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor={`body-${productId}`} className="block text-sm font-medium">
                    {t("reviewBody")}
                </label>
                <textarea
                    id={`body-${productId}`}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    className="w-full p-2 border"
                />
            </div>

            <div className="space-y-1">
                <label htmlFor={`fit-${productId}`} className="block text-sm font-medium">
                    {t("fit")}
                </label>
                <select
                    id={`fit-${productId}`}
                    value={fitVote}
                    onChange={(e) => setFitVote(e.target.value)}
                    className="w-full p-2 border bg-white"
                >
                    <option value="">{t("fitNone")}</option>
                    <option value="small">{t("fitSmall")}</option>
                    <option value="true">{t("fitTrue")}</option>
                    <option value="large">{t("fitLarge")}</option>
                </select>
            </div>

            <Button type="submit" disabled={submitting}>
                {submitting ? t("submitting") : t("submitReview")}
            </Button>
        </form>
    );
};

export default ReviewForm;
