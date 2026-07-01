import prismadb from "@/lib/prismadb";
import { getUserId } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string; subscriberId: string }> }
) {
    try {
        const userId = await getUserId();
        const { subscriberId, storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!subscriberId) {
            return new NextResponse("Subscriber id is required", {
                status: 400,
            });
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

        const subscriber = await prismadb.subscriber.deleteMany({
            where: {
                id: subscriberId,
                storeId,
            },
        });

        return NextResponse.json(subscriber);
    } catch (err) {
        console.log("[SUBSCRIBER_DELETE]", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}
