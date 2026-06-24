import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Review } from "@/types";
import { localizedField } from "@/lib/i18n-content";
import { aggregateRatingJsonLd } from "@/lib/seo";

interface ProductReviewsProps {
    reviews: Review[];
    locale: string;
}

// Renders a fixed five-star row with `filled` of them lit. Decorative; the
// numeric value is exposed to assistive tech via the surrounding label.
const Stars = ({ filled }: { filled: number }) => {
    const rounded = Math.round(filled);
    return (
        <span aria-hidden="true" className="text-ink">
            {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < rounded ? "text-ink" : "text-border"}>
                    ★
                </span>
            ))}
        </span>
    );
};

// Approved-reviews block for the product detail page: average rating + count,
// a buyer-photo wall (ReviewImage urls), and the individual reviews. Editorial,
// radius-0, token utilities only. Renders the empty state when there are none.
const ProductReviews = async ({ reviews, locale }: ProductReviewsProps) => {
    const t = await getTranslations("Reviews");

    const agg = aggregateRatingJsonLd(reviews);

    if (!agg) {
        return (
            <section className="mt-12">
                <h2 className="text-2xl font-light tracking-tight text-ink">
                    {t("reviews")}
                </h2>
                <p className="mt-4 text-sm text-muted-strong">{t("noReviews")}</p>
            </section>
        );
    }

    const fitLabel = (vote?: string | null) => {
        if (vote === "small") return t("fitSmall");
        if (vote === "large") return t("fitLarge");
        if (vote === "true") return t("fitTrue");
        return null;
    };

    const photos = reviews.flatMap((r) => r.images ?? []);

    return (
        <section className="mt-12">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h2 className="text-2xl font-light tracking-tight text-ink">
                    {t("reviews")}
                </h2>
                <div className="flex items-center gap-x-2" aria-label={`${agg.ratingValue} / 5`}>
                    <Stars filled={agg.ratingValue} />
                    <span className="text-sm text-muted-strong">
                        {agg.ratingValue.toFixed(1)} · {t("reviewsCount", { count: agg.reviewCount })}
                    </span>
                </div>
            </div>

            {photos.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {photos.map((img) => (
                        <div key={img.id} className="relative aspect-square overflow-hidden border border-border">
                            <Image
                                src={img.url}
                                alt={t("buyerPhotoAlt")}
                                fill
                                sizes="(max-width: 640px) 33vw, 16vw"
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            <ul className="mt-8 flex flex-col gap-y-8">
                {reviews.map((review) => {
                    const body = localizedField(review.bodyI18n, locale, review.body ?? "");
                    const fit = fitLabel(review.fitVote);
                    return (
                        <li key={review.id} className="border-b border-border pb-6 last:border-b-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <Stars filled={review.rating} />
                                <span className="text-sm font-medium text-ink">
                                    {review.customerName}
                                </span>
                                {review.verified && (
                                    <span className="text-xs uppercase tracking-wide text-muted-strong">
                                        {t("verifiedBuyer")}
                                    </span>
                                )}
                            </div>
                            {fit && (
                                <p className="mt-1 text-xs uppercase tracking-wide text-muted-strong">
                                    {t("fitLabel")}: {fit}
                                </p>
                            )}
                            {body && (
                                <p className="mt-2 whitespace-pre-line text-sm text-text">{body}</p>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default ProductReviews;
