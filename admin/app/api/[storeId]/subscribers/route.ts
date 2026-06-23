import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";

// CORS headers so the store (a different origin) can POST the newsletter
// signup. Mirrors the public checkout route.
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

const subscribeSchema = z.object({
    email: z.string().email(),
});

// POST (public): newsletter signup. Modeled like the public checkout flow —
// no admin auth, CORS enabled. Duplicate emails are accepted gracefully (the
// signup is idempotent) thanks to the @@unique([storeId, email]) constraint.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const body = await req.json();

        const parsed = subscribeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid email" },
                { status: 400, headers: corsHeaders }
            );
        }

        const email = parsed.data.email.trim().toLowerCase();

        if (!storeId) {
            return NextResponse.json(
                { error: "Store Id is required" },
                { status: 400, headers: corsHeaders }
            );
        }

        // Upsert on the composite unique key so a repeated signup is a no-op
        // rather than a duplicate-key error.
        await prismadb.subscriber.upsert({
            where: {
                storeId_email: {
                    storeId,
                    email,
                },
            },
            update: {},
            create: {
                storeId,
                email,
            },
        });

        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (err) {
        console.log(`[SUBSCRIBERS_POST] ${err}`);
        return NextResponse.json(
            { error: "Internal error" },
            { status: 500, headers: corsHeaders }
        );
    }
}

// GET (admin-authed): list subscribers for the store. Auth + store ownership
// check mirrors the billboards/products GET routes.
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

        const subscribers = await prismadb.subscriber.findMany({
            where: {
                storeId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(subscribers);
    } catch (err) {
        console.log(`[SUBSCRIBERS_GET] ${err}`);
        return new NextResponse("Internal error", { status: 500 });
    }
}
