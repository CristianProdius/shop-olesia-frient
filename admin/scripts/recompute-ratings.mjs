// One-off backfill: recompute Product.ratingAvg / ratingCount for every product
// from its APPROVED reviews. Additive and idempotent — safe to run repeatedly.
//
// Run (from the admin/ dir, or inside the container which has @prisma/client +
// DATABASE_URL):
//   node scripts/recompute-ratings.mjs
//   STORE_ID=<id> node scripts/recompute-ratings.mjs   # scope to one store

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const where = process.env.STORE_ID ? { storeId: process.env.STORE_ID } : {};
    const products = await prisma.product.findMany({
        where,
        select: { id: true, storeId: true },
    });

    let updated = 0;
    for (const product of products) {
        const agg = await prisma.review.aggregate({
            where: { storeId: product.storeId, productId: product.id, status: "approved" },
            _avg: { rating: true },
            _count: { _all: true },
        });
        const count = agg._count._all;
        const avg =
            count > 0 && agg._avg.rating != null
                ? Math.round(agg._avg.rating * 10) / 10
                : null;

        await prisma.product.updateMany({
            where: { id: product.id, storeId: product.storeId },
            data: { ratingAvg: avg, ratingCount: count },
        });
        if (count > 0) updated += 1;
    }

    console.log(
        `Recomputed ratings for ${products.length} products (${updated} with at least one approved review).`,
    );
}

main()
    .catch((err) => {
        console.error("[RECOMPUTE_RATINGS]", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
