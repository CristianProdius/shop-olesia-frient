import prismadb from "@/lib/prismadb";
import { getUserId } from '@/lib/server-auth'
import { recomputeProductRating } from "@/lib/ratings";
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string, reviewId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId, reviewId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!reviewId) {
            return new NextResponse("Review id is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const review = await prismadb.review.findFirst({
            where: {
                id: reviewId,
                storeId,
            },
            include: { images: true },
        })

        if (!review) {
            return new NextResponse("Review not found", { status: 404 });
        }

        return NextResponse.json(review);
    } catch (err) {
        console.log('[REVIEW_GET]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

// PATCH updates moderation status (approve/reject) and/or editable fields.
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string, reviewId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { storeId, reviewId } = await params;

        const { status, customerName, rating, body: reviewBody, fitVote, verified } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!reviewId) {
            return new NextResponse("Review id is required", { status: 400 });
        }

        if (status && !["pending", "approved", "rejected"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const ratingNum = rating !== undefined ? Number(rating) : undefined;

        const existing = await prismadb.review.findFirst({
            where: { id: reviewId, storeId },
            select: { productId: true },
        });

        const review = await prismadb.review.updateMany({
            where: {
                id: reviewId,
                storeId,
            },
            data: {
                ...(status !== undefined ? { status } : {}),
                ...(customerName !== undefined ? { customerName } : {}),
                ...(ratingNum !== undefined ? { rating: ratingNum } : {}),
                ...(reviewBody !== undefined ? { body: reviewBody } : {}),
                ...(fitVote !== undefined ? { fitVote } : {}),
                ...(verified !== undefined ? { verified } : {}),
            }
        })

        // Moderation or a rating edit changes the product's approved-review
        // rollup; recompute (best-effort — never fail the moderation action).
        if (existing?.productId && (status !== undefined || ratingNum !== undefined)) {
            try {
                await recomputeProductRating(storeId, existing.productId);
            } catch (ratingErr) {
                console.log('[REVIEW_PATCH_RATING]', ratingErr);
            }
        }

        return NextResponse.json(review);
    } catch (err) {
        console.log('[REVIEW_PATCH]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string, reviewId: string }> }
) {
    try {
        const userId = await getUserId();
        const { reviewId, storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!reviewId) {
            return new NextResponse("Review id is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const existing = await prismadb.review.findFirst({
            where: { id: reviewId, storeId },
            select: { productId: true },
        });

        const review = await prismadb.review.deleteMany({
            where: {
                id: reviewId,
                storeId,
            }
        })

        // Removing a review changes the product's approved-review rollup.
        if (existing?.productId) {
            try {
                await recomputeProductRating(storeId, existing.productId);
            } catch (ratingErr) {
                console.log('[REVIEW_DELETE_RATING]', ratingErr);
            }
        }

        return NextResponse.json(review);
    } catch (err) {
        console.log('[REVIEW_DELETE]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}
