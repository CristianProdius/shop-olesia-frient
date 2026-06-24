import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";

// CORS headers so the store (a different origin) can POST a back-in-stock
// waitlist signup. Mirrors the public subscribers/checkout routes.
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

const notifySchema = z.object({
    variantId: z.string().min(1),
    email: z.string().email(),
    locale: z.string().optional(),
});

// POST (public): join the back-in-stock waitlist for a sold-out variant.
// No admin auth, CORS enabled. Duplicate (variantId, email) signups are
// accepted gracefully (idempotent) thanks to @@unique([variantId, email]).
export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const body = await req.json();

        const parsed = notifySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid email or variant" },
                { status: 400, headers: corsHeaders }
            );
        }

        if (!storeId) {
            return NextResponse.json(
                { error: "Store Id is required" },
                { status: 400, headers: corsHeaders }
            );
        }

        const email = parsed.data.email.trim().toLowerCase();
        const { variantId } = parsed.data;
        const locale = parsed.data.locale ?? "en";

        // Upsert on the composite unique key so a repeated signup is a no-op
        // rather than a duplicate-key error. Don't reset `notified` on dup.
        await prismadb.stockNotification.upsert({
            where: {
                variantId_email: {
                    variantId,
                    email,
                },
            },
            update: {},
            create: {
                storeId,
                variantId,
                email,
                locale,
            },
        });

        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (err) {
        console.log(`[STOCK_NOTIFICATIONS_POST] ${err}`);
        return NextResponse.json(
            { error: "Internal error" },
            { status: 500, headers: corsHeaders }
        );
    }
}

// GET (admin-authed): list waitlist rows for the store, newest first. Resolves
// variant -> product name best-effort (variants/products live in this same
// Prisma schema), with a fallback when a variant can no longer be found.
export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const notifications = await prismadb.stockNotification.findMany({
            where: {
                storeId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Resolve variant -> product name in one batched query.
        const variantIds = Array.from(
            new Set(notifications.map((n) => n.variantId))
        );
        const variants = await prismadb.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: true, size: true, color: true },
        });
        const variantMap = new Map(variants.map((v) => [v.id, v]));

        const enriched = notifications.map((n) => {
            const variant = variantMap.get(n.variantId);
            return {
                ...n,
                productName: variant?.product?.name ?? null,
                sizeValue: variant?.size?.value ?? null,
                colorName: variant?.color?.name ?? null,
            };
        });

        return NextResponse.json(enriched);
    } catch (err) {
        console.log(`[STOCK_NOTIFICATIONS_GET] ${err}`);
        return new NextResponse("Internal error", { status: 500 });
    }
}
