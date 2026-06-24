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
// variant. Finds not-yet-notified rows, emails each via the env-gated
// `sendEmail` (which NO-OPs gracefully without RESEND_API_KEY), and flips
// `notified=true`. Rows are marked notified regardless of whether the email
// actually sent — without a key the send is a deliberate no-op and we don't
// want to retry the whole list forever; the count distinguishes the two.
//
// Returns { notified: <emailed>, skipped: <not emailed but marked> }.
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
            return NextResponse.json({ notified: 0, skipped: 0 });
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

        let notified = 0;
        let skipped = 0;

        for (const row of pending) {
            const { subject, html } = backInStockEmail(productLabel, row.locale);
            const result = await sendEmail({ to: row.email, subject, html });
            if (result.sent) {
                notified += 1;
            } else {
                // Skipped (no key) or send error — still mark to avoid
                // re-notifying forever; reflected in the skipped count.
                skipped += 1;
            }
        }

        await prismadb.stockNotification.updateMany({
            where: { id: { in: pending.map((r) => r.id) } },
            data: { notified: true },
        });

        return NextResponse.json({ notified, skipped });
    } catch (err) {
        console.log(`[STOCK_NOTIFICATIONS_NOTIFY_POST] ${err}`);
        return new NextResponse("Internal error", { status: 500 });
    }
}
