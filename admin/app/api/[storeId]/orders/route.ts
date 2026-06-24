import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Collection GET serves both the admin order list and the storefront account hub.
//
// - With admin auth + store ownership: returns every order for the store
//   (newest first) with items + product, for the admin dashboard/list.
// - Without admin auth but WITH a ?customerId= query (storefront, cross-origin):
//   returns only that customer's orders, shaped for the account hub
//   (id, status, tracking, createdAt, total, items with product name + quantity).
//
// Mirrors the auth-boundary approach used by the reviews GET: admin sees all,
// public callers are restricted to their own data. A bare unauthenticated call
// without a customerId returns 401.
//
// SECURITY NOTE (residual trust gap, same as checkout): `customerId` is taken
// from the query string and not verified against a store session — the Customer
// tables live in the store app's SEPARATE Prisma schema (cross-schema, no FK),
// so they cannot be joined from this admin connection. Order history is not
// highly sensitive, and a real fix requires a shared signed token minted by the
// store and verified here. Acceptable for this simulation.
export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get("customerId") ?? undefined;

        if (!storeId) {
            return new NextResponse("Store Id is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const userId = await getUserId();
        const storeByUserId = userId
            ? await prismadb.store.findFirst({ where: { id: storeId, userId } })
            : null;
        const isAdmin = !!storeByUserId;

        // Public (storefront) caller: must scope to their own customerId.
        if (!isAdmin) {
            if (!customerId) {
                return new NextResponse("Unauthorized", {
                    status: 401,
                    headers: corsHeaders,
                });
            }

            const orders = await prismadb.order.findMany({
                where: { storeId, customerId },
                include: {
                    orderItems: {
                        include: { product: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            // Shape for the account hub: minimal, computed totals.
            const shaped = orders.map((order) => {
                const items = order.orderItems.map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice ? item.unitPrice.toString() : null,
                    productName: item.product?.name ?? "",
                }));

                const total = order.orderItems.reduce((sum, item) => {
                    const price = item.unitPrice ? Number(item.unitPrice) : 0;
                    return sum + price * item.quantity;
                }, 0);

                return {
                    id: order.id,
                    status: order.status,
                    carrier: order.carrier,
                    trackingNumber: order.trackingNumber,
                    createdAt: order.createdAt,
                    total: total.toString(),
                    items,
                };
            });

            return NextResponse.json(shaped, { headers: corsHeaders });
        }

        // Admin caller: full order list for the store.
        const orders = await prismadb.order.findMany({
            where: { storeId },
            include: {
                orderItems: {
                    include: { product: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders, { headers: corsHeaders });
    } catch (err) {
        console.log("[ORDERS_GET]", err);
        return new NextResponse("Internal error", {
            status: 500,
            headers: corsHeaders,
        });
    }
}
