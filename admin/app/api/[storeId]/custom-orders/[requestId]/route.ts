import prismadb from "@/lib/prismadb";
import { getUserId } from "@/lib/server-auth";
import { NextResponse } from "next/server";
import * as z from "zod";

const CUSTOM_ORDER_STATUSES = [
    "new",
    "quoted",
    "accepted",
    "declined",
] as const;

const patchSchema = z.object({
    status: z.enum(CUSTOM_ORDER_STATUSES),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string; requestId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId, requestId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!requestId) {
            return new NextResponse("Request id is required", { status: 400 });
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

        const request = await prismadb.customOrderRequest.findFirst({
            where: {
                id: requestId,
                storeId,
            },
        });

        return NextResponse.json(request);
    } catch (err) {
        console.log("[CUSTOM_ORDER_GET]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string; requestId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { storeId, requestId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!requestId) {
            return new NextResponse("Request id is required", { status: 400 });
        }

        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return new NextResponse("Invalid request body", { status: 400 });
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

        await prismadb.customOrderRequest.updateMany({
            where: {
                id: requestId,
                storeId,
            },
            data: {
                status: parsed.data.status,
            },
        });

        return NextResponse.json({ count: 1 });
    } catch (err) {
        console.log("[CUSTOM_ORDER_PATCH]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}
