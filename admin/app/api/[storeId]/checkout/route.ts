import prismadb from "@/lib/prismadb";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email-templates";
import { NextResponse } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Normalized cart line used internally.
type CheckoutLine = {
    productId: string;
    variantId: string | null;
    quantity: number;
};

// Accepted request body shapes:
//
// New (preferred):
//   {
//     items: [{ productId: string, variantId?: string, quantity?: number }],
//     customerName: string,
//     email?: string,
//     phone?: string,
//     address?: string,
//     locale?: "en" | "ru" | "ro",
//     customerId: string,
//   }
//
// Back-compat (old store builds):
//   { productIds: string[], customerId, name, address, phone }
//   -> each productId becomes a line of quantity 1 with no variant; `name` is
//      used as the customer name (no longer folded into the address string).
//
// Simulated checkout: no real payment provider. The order is created and
// immediately marked paid (status "paid"), mirroring what the old Stripe
// webhook did on `checkout.session.completed`.
//
// SECURITY NOTE (residual trust gap): `customerId` is taken from the request
// body and only validated for presence/format below. The store customer's
// session is NOT verified here because the Customer tables live in the store
// app's SEPARATE Prisma schema (cross-schema, no foreign key), so we cannot
// join/look them up from this admin connection. A real fix requires a shared
// signed token (or shared secret) minted by the store and verified here before
// trusting the customer identity. Acceptable only for the payment simulation.
export async function POST(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
    const body = await req.json();
    const { storeId } = await params;

    const {
        items,
        productIds,
        customerId,
        customerName,
        name,
        email,
        address,
        phone,
        locale,
    } = body ?? {};

    // --- Validate customerId (presence/format only — see SECURITY NOTE above).
    if (typeof customerId !== "string" || customerId.trim().length === 0) {
        return new NextResponse("A valid customerId is required", {
            status: 400,
            headers: corsHeaders,
        });
    }

    // --- Normalize the incoming lines from either body shape.
    let lines: CheckoutLine[] = [];
    if (Array.isArray(items) && items.length > 0) {
        lines = items.map((it: { productId: string; variantId?: string; quantity?: number }) => ({
            productId: it.productId,
            variantId: it.variantId ?? null,
            quantity: Math.max(1, Number(it.quantity) || 1),
        }));
    } else if (Array.isArray(productIds) && productIds.length > 0) {
        // Back-compat: bare product ids, quantity 1, no variant.
        lines = productIds.map((productId: string) => ({
            productId,
            variantId: null,
            quantity: 1,
        }));
    }

    if (lines.length === 0 || lines.some((l) => !l.productId)) {
        return new NextResponse("Order items are required", {
            status: 400,
            headers: corsHeaders,
        });
    }

    const resolvedName: string = (customerName ?? name ?? "").toString();
    const resolvedLocale: string = ["en", "ru", "ro"].includes(locale) ? locale : "en";

    // Snapshot current product prices for unitPrice.
    const products = await prismadb.product.findMany({
        where: { id: { in: lines.map((l) => l.productId) }, storeId },
        select: { id: true, price: true, name: true },
    });
    const priceById = new Map(products.map((p) => [p.id, p.price]));
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    if (lines.some((l) => !priceById.has(l.productId))) {
        return new NextResponse("One or more products were not found", {
            status: 400,
            headers: corsHeaders,
        });
    }

    try {
        // Transactionally create the order, its items, and decrement stock.
        // No overselling: if any variant lacks sufficient stock the whole
        // transaction is rolled back and a 400 is returned.
        const order = await prismadb.$transaction(async (tx) => {
            const created = await tx.order.create({
                data: {
                    storeId,
                    isPaid: true,
                    status: "paid",
                    customerId,
                    customerName: resolvedName,
                    email: email ?? "",
                    address: address ?? "",
                    phone: phone ?? "",
                    locale: resolvedLocale,
                    orderItems: {
                        create: lines.map((l) => ({
                            productId: l.productId,
                            variantId: l.variantId,
                            quantity: l.quantity,
                            unitPrice: priceById.get(l.productId) ?? null,
                        })),
                    },
                },
            });

            // Decrement stock for each line that has a variant. Guarded by a
            // conditional updateMany (stockQty >= quantity); if it matches 0
            // rows, stock is insufficient -> throw to roll back the whole order.
            for (const line of lines) {
                if (!line.variantId) continue;

                const result = await tx.productVariant.updateMany({
                    where: {
                        id: line.variantId,
                        productId: line.productId,
                        stockQty: { gte: line.quantity },
                    },
                    data: {
                        stockQty: { decrement: line.quantity },
                    },
                });

                if (result.count === 0) {
                    // Insufficient stock (or unknown variant) -> abort everything.
                    throw new OutOfStockError(line.variantId);
                }
            }

            return created;
        });

        // Fire the order-confirmation email (env-gated; sendEmail never throws,
        // but we still guard so a comms failure can never break checkout).
        if (order.email) {
            try {
                const { subject, html } = orderConfirmationEmail(
                    {
                        id: order.id,
                        email: order.email,
                        customerName: order.customerName,
                        locale: order.locale,
                        orderItems: lines.map((l) => ({
                            quantity: l.quantity,
                            unitPrice: priceById.get(l.productId) ?? null,
                            productName: nameById.get(l.productId) ?? l.productId,
                            productId: l.productId,
                        })),
                    },
                    order.locale,
                );
                await sendEmail({ to: order.email, subject, html });
            } catch (mailErr) {
                console.error("[CHECKOUT_EMAIL]", mailErr);
            }
        }

        return NextResponse.json(
            { success: true, orderId: order.id },
            { headers: corsHeaders }
        );
    } catch (err) {
        if (err instanceof OutOfStockError) {
            return new NextResponse(
                JSON.stringify({ error: "OUT_OF_STOCK", variantId: err.variantId }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
        console.error("[CHECKOUT_POST]", err);
        return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
    }
}

class OutOfStockError extends Error {
    variantId: string;
    constructor(variantId: string) {
        super(`Insufficient stock for variant ${variantId}`);
        this.name = "OutOfStockError";
        this.variantId = variantId;
    }
}
