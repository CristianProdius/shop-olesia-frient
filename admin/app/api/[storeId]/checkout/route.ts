import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Simulated checkout. No real payment provider — the order is created and
// immediately marked paid, mirroring what the old Stripe webhook did on
// `checkout.session.completed`.
//
// SECURITY NOTE: this trusts `customerId` from the request body; it does not
// verify the store customer's session cross-origin. Acceptable for a payment
// simulation. When integrating a real provider, verify a signed token / shared
// secret between the store and admin before trusting customer/payment data.
export async function POST(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
    const { productIds, customerId, name, address, phone } = await req.json();
    const { storeId } = await params;

    // `name` is collected by the simulated checkout form for display; the Order
    // model has no name field, so fold it into the stored address line.
    const fullAddress = [name, address].filter(Boolean).join(" — ");

    if (!productIds || productIds.length === 0) {
        return new NextResponse("Product ids are required", { status: 400, headers: corsHeaders });
    }

    const order = await prismadb.order.create({
        data: {
            storeId: storeId,
            isPaid: true,
            customerId: customerId ?? null,
            address: fullAddress,
            phone: phone ?? "",
            orderItems: {
                create: productIds.map((productId: string) => ({
                    product: {
                        connect: {
                            id: productId
                        }
                    }
                }))
            }
        },
        include: {
            orderItems: true,
        }
    });

    // Archive the purchased products (old webhook behavior).
    const purchasedProductIds = order.orderItems.map((orderItem) => orderItem.productId);

    await prismadb.product.updateMany({
        where: {
            id: {
                in: [...purchasedProductIds]
            },
        },
        data: {
            isArchived: true,
        }
    });

    return NextResponse.json(
        { success: true, orderId: order.id },
        { headers: corsHeaders }
    );
}
