import prismadb from "@/lib/prismadb";

/**
 * Recomputes a product's denormalized rating rollup from its APPROVED reviews
 * and writes it to Product.ratingAvg / ratingCount. Sets ratingAvg to null and
 * ratingCount to 0 when there are no approved reviews. Best-effort — callers
 * should not let a rating recompute failure break the moderation action.
 */
export async function recomputeProductRating(
    storeId: string,
    productId: string,
): Promise<void> {
    const agg = await prismadb.review.aggregate({
        where: { storeId, productId, status: "approved" },
        _avg: { rating: true },
        _count: { _all: true },
    });

    const count = agg._count._all;
    const avg =
        count > 0 && agg._avg.rating != null
            ? Math.round(agg._avg.rating * 10) / 10
            : null;

    await prismadb.product.updateMany({
        where: { id: productId, storeId },
        data: { ratingAvg: avg, ratingCount: count },
    });
}
