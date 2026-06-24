import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";

// CORS headers so the store (a different origin) can POST a made-to-measure
// request. Mirrors the public subscribers/checkout routes.
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

const createSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    message: z.string().min(1),
    measurements: z.string().optional(),
    locale: z.string().optional(),
});

// POST (public): a shopper submits a custom-order request. No admin auth, CORS
// enabled. The request is created with status "new".
export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const body = await req.json();

        if (!storeId) {
            return NextResponse.json(
                { error: "Store Id is required" },
                { status: 400, headers: corsHeaders }
            );
        }

        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request" },
                { status: 400, headers: corsHeaders }
            );
        }

        const { name, email, phone, message, measurements, locale } =
            parsed.data;

        await prismadb.customOrderRequest.create({
            data: {
                storeId,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone?.trim() ?? "",
                message: message.trim(),
                measurements: measurements?.trim() || null,
                locale: locale ?? "en",
                status: "new",
            },
        });

        return NextResponse.json(
            { success: true },
            { headers: corsHeaders }
        );
    } catch (err) {
        console.log(`[CUSTOM_ORDERS_POST] ${err}`);
        return NextResponse.json(
            { error: "Internal error" },
            { status: 500, headers: corsHeaders }
        );
    }
}

// GET (admin-authed): list custom-order requests for the store, newest first.
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

        const requests = await prismadb.customOrderRequest.findMany({
            where: {
                storeId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(requests);
    } catch (err) {
        console.log(`[CUSTOM_ORDERS_GET] ${err}`);
        return new NextResponse("Internal error", { status: 500 });
    }
}
