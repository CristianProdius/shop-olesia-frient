import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Public guest-order lookup. Guests check out without a customerId (it is
// stored null), so the customerId-scoped collection GET cannot return their
// orders. Instead a guest looks up a single order with the order id they were
// shown at checkout PLUS the email they entered. The order is returned ONLY
// when ALL of the following match: the orderId, the order's email
// (case-insensitive), and the storeId. Anything else -> 404. This requires
// possession of both the order id and the email, so it does not leak orders.
//
// Accepts either GET ?email=...&orderId=... or POST { email, orderId }.
async function lookupOrder(storeId: string, orderId: string, email: string) {
    if (!storeId || !orderId || !email) {
        return null;
    }

    const order = await prismadb.order.findFirst({
        where: {
            id: orderId,
            storeId,
            email: { equals: email, mode: "insensitive" },
        },
        include: {
            orderItems: {
                include: {
                    product: true,
                },
            },
        },
    });

    return order;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { searchParams } = new URL(req.url);
        const email = (searchParams.get("email") ?? "").trim();
        const orderId = (searchParams.get("orderId") ?? "").trim();

        if (!email || !orderId) {
            return new NextResponse("email and orderId are required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const order = await lookupOrder(storeId, orderId, email);
        if (!order) {
            return new NextResponse("Order not found", {
                status: 404,
                headers: corsHeaders,
            });
        }

        return NextResponse.json(order, { headers: corsHeaders });
    } catch (err) {
        console.log("[ORDER_LOOKUP_GET]", err);
        return new NextResponse("Internal error", {
            status: 500,
            headers: corsHeaders,
        });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const body = await req.json();
        const email = (body?.email ?? "").toString().trim();
        const orderId = (body?.orderId ?? "").toString().trim();

        if (!email || !orderId) {
            return new NextResponse("email and orderId are required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const order = await lookupOrder(storeId, orderId, email);
        if (!order) {
            return new NextResponse("Order not found", {
                status: 404,
                headers: corsHeaders,
            });
        }

        return NextResponse.json(order, { headers: corsHeaders });
    } catch (err) {
        console.log("[ORDER_LOOKUP_POST]", err);
        return new NextResponse("Internal error", {
            status: 500,
            headers: corsHeaders,
        });
    }
}
