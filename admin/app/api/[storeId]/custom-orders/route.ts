import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { customOrderConfirmationEmail } from "@/lib/email-templates";

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

        // Best-effort, per-instance rate limit (see lib/rate-limit). A shared
        // store (Redis) is needed for correct multi-instance limits.
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
        if (!rateLimit(`custom-orders:${ip}`, 10, 60_000)) {
            return NextResponse.json(
                { error: "RATE_LIMITED" },
                { status: 429, headers: corsHeaders }
            );
        }

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

        // Verify the store exists to avoid orphan rows under bogus store ids.
        const store = await prismadb.store.findUnique({
            where: { id: storeId },
            select: { id: true },
        });
        if (!store) {
            return NextResponse.json(
                { error: "Store not found" },
                { status: 404, headers: corsHeaders }
            );
        }

        const { name, email, phone, message, measurements, locale } =
            parsed.data;

        const created = await prismadb.customOrderRequest.create({
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

        // Fire a confirmation email to the requester (env-gated; sendEmail never
        // throws, but we still guard so a comms failure can never break the
        // submission).
        if (created.email) {
            try {
                const { subject, html } = customOrderConfirmationEmail(
                    {
                        id: created.id,
                        name: created.name,
                        email: created.email,
                        locale: created.locale,
                    },
                    created.locale
                );
                await sendEmail({ to: created.email, subject, html });
            } catch (mailErr) {
                console.error("[CUSTOM_ORDERS_CONFIRMATION_EMAIL]", mailErr);
            }
        }

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
