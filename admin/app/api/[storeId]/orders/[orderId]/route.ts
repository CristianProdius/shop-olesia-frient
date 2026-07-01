import prismadb from "@/lib/prismadb";
import { getUserId } from "@/lib/server-auth";
import { sendEmail } from "@/lib/email";
import { orderShippedEmail, orderReviewRequestEmail } from "@/lib/email-templates";
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
    { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId, orderId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!orderId) {
            return new NextResponse("Order id is required", { status: 400 });
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

        const order = await prismadb.order.findFirst({
            where: {
                id: orderId,
                storeId,
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

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

        // Read the previous status so we can detect the transition INTO
        // "shipped" and only send the shipped email on that transition (not on
        // unrelated PATCHes that keep status === "shipped").
        const existing = await prismadb.order.findFirst({
            where: { id: orderId, storeId },
            select: { status: true, reviewRequestSentAt: true },
        });

        if (!existing) {
            return new NextResponse("Order not found", { status: 404 });
        }

        await prismadb.order.updateMany({
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

        // Send the shipped email only on the transition into "shipped".
        if (status === "shipped" && existing.status !== "shipped") {
            const updated = await prismadb.order.findFirst({
                where: { id: orderId, storeId },
                select: {
                    id: true,
                    email: true,
                    customerName: true,
                    locale: true,
                    carrier: true,
                    trackingNumber: true,
                },
            });

            if (updated?.email) {
                try {
                    const { subject, html } = orderShippedEmail(updated, updated.locale);
                    await sendEmail({ to: updated.email, subject, html });
                } catch (mailErr) {
                    console.error("[ORDER_SHIPPED_EMAIL]", mailErr);
                }
            }
        }

        // Send the review-request email once, on the transition into
        // "delivered", guarded by reviewRequestSentAt so it never repeats.
        if (
            status === "delivered" &&
            existing.status !== "delivered" &&
            !existing.reviewRequestSentAt
        ) {
            const delivered = await prismadb.order.findFirst({
                where: { id: orderId, storeId },
                select: {
                    id: true,
                    email: true,
                    customerName: true,
                    locale: true,
                    orderItems: {
                        select: {
                            quantity: true,
                            unitPrice: true,
                            product: { select: { id: true, name: true } },
                        },
                    },
                },
            });

            if (delivered?.email) {
                try {
                    const storeUrl =
                        process.env.STORE_URL ??
                        process.env.NEXT_PUBLIC_STORE_URL ??
                        "https://liletti.delice.my";
                    const { subject, html } = orderReviewRequestEmail(
                        {
                            id: delivered.id,
                            email: delivered.email,
                            customerName: delivered.customerName,
                            locale: delivered.locale,
                            orderItems: delivered.orderItems.map((oi) => ({
                                quantity: oi.quantity,
                                unitPrice: oi.unitPrice,
                                productId: oi.product?.id ?? null,
                                productName: oi.product?.name ?? null,
                            })),
                        },
                        storeUrl,
                        delivered.locale,
                    );
                    const result = await sendEmail({ to: delivered.email, subject, html });
                    // Mark as sent only on an actual send, so a missing key
                    // (skipped) or a transient error doesn't permanently
                    // suppress a later retry on re-delivery.
                    if (result.sent) {
                        await prismadb.order.updateMany({
                            where: { id: orderId, storeId },
                            data: { reviewRequestSentAt: new Date() },
                        });
                    }
                } catch (mailErr) {
                    console.error("[ORDER_REVIEW_EMAIL]", mailErr);
                }
            }
        }

        return NextResponse.json({ count: 1 });
    } catch (err) {
        console.log("[ORDER_PATCH]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId, orderId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!orderId) {
            return new NextResponse("Order id is required", { status: 400 });
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

        // OrderItem has no DB-level cascade (relationMode = "prisma"), so remove
        // the child rows first, then the order itself — atomically.
        const [, order] = await prismadb.$transaction([
            prismadb.orderItem.deleteMany({
                where: {
                    order: {
                        id: orderId,
                        storeId,
                    },
                },
            }),
            prismadb.order.deleteMany({
                where: {
                    id: orderId,
                    storeId,
                },
            }),
        ]);

        return NextResponse.json(order);
    } catch (err) {
        console.log("[ORDER_DELETE]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}
