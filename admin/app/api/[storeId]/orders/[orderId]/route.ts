import prismadb from "@/lib/prismadb";
import { getUserId } from "@/lib/server-auth";
import { NextResponse } from "next/server";
import * as z from "zod";

const ORDER_STATUSES = [
    "pending",
    "paid",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
] as const;

const patchSchema = z.object({
    status: z.enum(ORDER_STATUSES),
    carrier: z.string().optional().nullable(),
    trackingNumber: z.string().optional().nullable(),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;
        if (!orderId) {
            return new NextResponse("Order id is required", { status: 400 });
        }

        const order = await prismadb.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return NextResponse.json(order);
    } catch (err) {
        console.log("[ORDER_GET]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { storeId, orderId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!orderId) {
            return new NextResponse("Order id is required", { status: 400 });
        }

        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return new NextResponse("Invalid request body", { status: 400 });
        }

        const { status, carrier, trackingNumber } = parsed.data;

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const order = await prismadb.order.updateMany({
            where: {
                id: orderId,
                storeId,
            },
            data: {
                status,
                carrier: carrier ?? null,
                trackingNumber: trackingNumber ?? null,
            },
        });

        return NextResponse.json(order);
    } catch (err) {
        console.log("[ORDER_PATCH]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}
