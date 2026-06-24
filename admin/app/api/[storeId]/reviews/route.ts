import { NextResponse } from "next/server";
import { getUserId } from '@/lib/server-auth'
import prismadb from "@/lib/prismadb";
import { buildI18nField } from "@/lib/i18n-content";
import { rateLimit } from "@/lib/rate-limit";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// POST creates a review. Two paths, distinguished by admin auth:
//
// - Admin (auth + store ownership): manual creation (Instagram import /
//   admin-entered). Honors caller-supplied `status`, `verified`, `bodyI18n`,
//   `images`, `source`, mirroring billboards/faqs.
//
// - Public (no admin auth, cross-origin storefront): shopper submission.
//   Always forced to `status: "pending"` and `verified: false`. The `verified`
//   flag is NEVER trusted from the body: verification is granted only by an
//   admin during moderation (the admin-authed PATCH supports setting it),
//   because the cross-app customerId is not authenticated here. A real fix
//   needs a store-minted signed token (out of scope). customerId/customerName/
//   rating/body/fitVote are still accepted for storage.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const {
            productId,
            customerId,
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

        if (!storeId) {
            return new NextResponse("Store Id is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        if (!productId) {
            return new NextResponse("Product id is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const ratingNum = Number(rating);
        if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
            return new NextResponse("Rating (1-5) is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const storeByUserId = userId
            ? await prismadb.store.findFirst({ where: { id: storeId, userId } })
            : null;
        const isAdmin = !!storeByUserId;

        const bodyMap = bodyI18n ? buildI18nField(bodyI18n) : {};
        const bodyPlain = reviewBody ?? bodyMap.en ?? null;

        const imageUrls: { url: string }[] = Array.isArray(images)
            ? images.filter((i: { url?: string }) => i?.url).map((i: { url: string }) => ({ url: i.url }))
            : [];

        if (!isAdmin) {
            // --- Public storefront submission path. ---

            // Best-effort, per-instance rate limit (see lib/rate-limit). A
            // shared store (Redis) is needed for correct multi-instance limits.
            const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
            if (!rateLimit(`reviews:${ip}`, 10, 60_000)) {
                return NextResponse.json(
                    { error: "RATE_LIMITED" },
                    { status: 429, headers: corsHeaders }
                );
            }

            if (typeof customerId !== "string" || customerId.trim().length === 0) {
                return new NextResponse("A valid customerId is required", {
                    status: 400,
                    headers: corsHeaders,
                });
            }

            // Validate the product belongs to this store before storing a review.
            const product = await prismadb.product.findFirst({
                where: { id: productId, storeId },
                select: { id: true },
            });
            if (!product) {
                return new NextResponse("Product not found", {
                    status: 404,
                    headers: corsHeaders,
                });
            }

            // SECURITY: verified status is NEVER trusted from the public body.
            // Public submissions are always created with verified:false and
            // status:"pending". Verification is granted only by an admin during
            // moderation (via the admin-authed PATCH). The cross-app customerId
            // is not authenticated here; a real fix needs a store-minted signed
            // token (out of scope).
            const review = await prismadb.review.create({
                data: {
                    storeId,
                    productId,
                    customerId,
                    customerName: customerName ?? "",
                    rating: ratingNum,
                    body: bodyPlain,
                    bodyI18n: Object.keys(bodyMap).length ? bodyMap : undefined,
                    source: "web",
                    status: "pending",
                    fitVote: fitVote ?? null,
                    verified: false,
                    images: imageUrls.length ? { create: imageUrls } : undefined,
                },
                include: { images: true },
            });

            return NextResponse.json(review, { headers: corsHeaders });
        }

        // --- Admin manual creation path. ---
        const review = await prismadb.review.create({
            data: {
                storeId,
                productId,
                customerId: customerId ?? null,
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

        return NextResponse.json(review, { headers: corsHeaders });

    } catch (err) {
        console.log(`[REVIEWS_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500, headers: corsHeaders })
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
            return new NextResponse("Store Id is required", { status: 400, headers: corsHeaders });
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

        return NextResponse.json(reviews, { headers: corsHeaders });

    } catch (err) {
        console.log(`[REVIEWS_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500, headers: corsHeaders })
    }
}
