import { NextResponse } from "next/server";
import { getUserId } from '@/lib/server-auth'
import prismadb from "@/lib/prismadb";
import { buildI18nField } from "@/lib/i18n-content";

// Manual review creation (e.g. Instagram import / admin-entered). The public
// storefront submit path is added in Task 2; for now POST requires admin auth +
// store ownership, mirroring billboards/faqs.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const {
            productId,
            customerName,
            rating,
            body: reviewBody,
            bodyI18n,
            source,
            status,
            fitVote,
            verified,
            images,
        } = body;
        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!productId) {
            return new NextResponse("Product id is required", { status: 400 });
        }

        const ratingNum = Number(rating);
        if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
            return new NextResponse("Rating (1-5) is required", { status: 400 });
        }

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
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

        const bodyMap = bodyI18n ? buildI18nField(bodyI18n) : {};
        const bodyPlain = reviewBody ?? bodyMap.en ?? null;

        const imageUrls: { url: string }[] = Array.isArray(images)
            ? images.filter((i: { url?: string }) => i?.url).map((i: { url: string }) => ({ url: i.url }))
            : [];

        const review = await prismadb.review.create({
            data: {
                storeId,
                productId,
                customerName: customerName ?? "",
                rating: ratingNum,
                body: bodyPlain,
                bodyI18n: Object.keys(bodyMap).length ? bodyMap : undefined,
                source: source ?? "web",
                status: status ?? "pending",
                fitVote: fitVote ?? null,
                verified: verified ?? false,
                images: imageUrls.length ? { create: imageUrls } : undefined,
            },
            include: { images: true },
        })

        return NextResponse.json(review);

    } catch (err) {
        console.log(`[REVIEWS_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}

// GET serves both the admin moderation list and the storefront.
// - With admin auth + store ownership: returns every review (optionally filtered
//   by ?productId= and ?status=) for moderation.
// - Without admin auth (storefront): returns only `approved` reviews; a
//   ?productId= filter is supported so the product page fetches just its reviews.
export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId") ?? undefined;
        const statusParam = searchParams.get("status") ?? undefined;

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
        }

        const userId = await getUserId();
        const storeByUserId = userId
            ? await prismadb.store.findFirst({ where: { id: storeId, userId } })
            : null;
        const isAdmin = !!storeByUserId;

        // Storefront callers (no admin ownership) can only ever see approved
        // reviews, regardless of any ?status= they pass.
        const status = isAdmin ? statusParam : "approved";

        const reviews = await prismadb.review.findMany({
            where: {
                storeId,
                ...(productId ? { productId } : {}),
                ...(status ? { status } : {}),
            },
            include: { images: true },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(reviews);

    } catch (err) {
        console.log(`[REVIEWS_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}
