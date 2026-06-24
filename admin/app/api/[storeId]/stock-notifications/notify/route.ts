import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";
import { sendEmail } from "@/lib/email";
import { backInStockEmail } from "@/lib/email-templates";

const notifyBodySchema = z.object({
    variantId: z.string().min(1),
});

// POST (admin-authed): trigger a back-in-stock notification pass for a single
// variant. Finds not-yet-notified rows and emails each concurrently via the
// env-gated `sendEmail` (which NO-OPs gracefully without RESEND_API_KEY).
// Only rows whose send actually succeeded — or was a graceful skip (no key
// configured, so nothing to retry) — are flipped to `notified=true`. Rows that
// genuinely FAILED (sent:false with an error) are left notified=false so a
// later "Notify now" retries them.
//
// Returns { notified: <succeeded+skipped>, failed: <genuine failures> }.
export async function POST(
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
            where: { id: storeId, userId },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await req.json();
        const parsed = notifyBodySchema.safeParse(body);
        if (!parsed.success) {
            return new NextResponse("variantId is required", { status: 400 });
        }

        const { variantId } = parsed.data;

        const pending = await prismadb.stockNotification.findMany({
            where: {
                storeId,
                variantId,
                notified: false,
            },
        });

        if (pending.length === 0) {
            return NextResponse.json({ notified: 0, failed: 0 });
        }

        // Best-effort product label for the email body/subject.
        const variant = await prismadb.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true, size: true, color: true },
        });
        const labelParts = [
            variant?.product?.name,
            variant?.size?.value,
            variant?.color?.name,
        ].filter(Boolean);
        const productLabel = labelParts.length ? labelParts.join(" / ") : null;

        // Send concurrently; the per-variant notify list is bounded.
        const results = await Promise.allSettled(
            pending.map((row) => {
                const { subject, html } = backInStockEmail(productLabel, row.locale);
                return sendEmail({ to: row.email, subject, html });
            })
        );

        // Mark notified only for rows that actually succeeded or were a graceful
        // skip (no key configured — nothing to retry). Genuine failures
        // (sent:false with an error) stay notified=false for a later retry.
        const succeededIds: string[] = [];
        let failed = 0;

        results.forEach((result, i) => {
            const row = pending[i];
            const ok =
                result.status === "fulfilled" &&
                (result.value.sent === true || result.value.skipped === true);
            if (ok) {
                succeededIds.push(row.id);
            } else {
                failed += 1;
            }
        });

        if (succeededIds.length > 0) {
            await prismadb.stockNotification.updateMany({
                where: { id: { in: succeededIds } },
                data: { notified: true },
            });
        }

        return NextResponse.json({ notified: succeededIds.length, failed });
    } catch (err) {
        console.log(`[STOCK_NOTIFICATIONS_NOTIFY_POST] ${err}`);
        return new NextResponse("Internal error", { status: 500 });
    }
}
