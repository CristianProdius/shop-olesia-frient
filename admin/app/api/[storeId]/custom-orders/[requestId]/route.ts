import prismadb from "@/lib/prismadb";
import { getUserId } from "@/lib/server-auth";
import { sendEmail } from "@/lib/email";
import { customOrderStatusEmail } from "@/lib/email-templates";
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

        // Read the previous status so we only email on a real transition INTO
        // a notifiable status (quoted | accepted | declined), mirroring the
        // order PATCH "shipped" email pattern.
        const existing = await prismadb.customOrderRequest.findFirst({
            where: { id: requestId, storeId },
            select: {
                status: true,
                name: true,
                email: true,
                locale: true,
            },
        });

        if (!existing) {
            return new NextResponse("Request not found", { status: 404 });
        }

        const nextStatus = parsed.data.status;

        await prismadb.customOrderRequest.updateMany({
            where: {
                id: requestId,
                storeId,
            },
            data: {
                status: nextStatus,
            },
        });

        // Send a status-specific email only on the transition into a notifiable
        // status. Guarded so a missing email / comms failure never breaks the
        // status update.
        const notifiable = ["quoted", "accepted", "declined"] as const;
        const isNotifiable = (
            notifiable as readonly string[]
        ).includes(nextStatus);

        if (isNotifiable && nextStatus !== existing.status && existing.email) {
            try {
                const { subject, html } = customOrderStatusEmail(
                    nextStatus as "quoted" | "accepted" | "declined",
                    {
                        id: requestId,
                        name: existing.name,
                        email: existing.email,
                        locale: existing.locale,
                    },
                    existing.locale
                );
                await sendEmail({ to: existing.email, subject, html });
            } catch (mailErr) {
                console.error("[CUSTOM_ORDER_STATUS_EMAIL]", mailErr);
            }
        }

        return NextResponse.json({ count: 1 });
    } catch (err) {
        console.log("[CUSTOM_ORDER_PATCH]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
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

        const request = await prismadb.customOrderRequest.deleteMany({
            where: {
                id: requestId,
                storeId,
            },
        });

        return NextResponse.json(request);
    } catch (err) {
        console.log("[CUSTOM_ORDER_DELETE]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}
