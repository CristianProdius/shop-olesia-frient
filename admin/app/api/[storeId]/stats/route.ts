import { NextResponse } from "next/server";
import { getUserId } from '@/lib/server-auth'
import prismadb from "@/lib/prismadb";
import { buildI18nField } from "@/lib/i18n-content";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { key, label, labelI18n, value, order, isPublished } = body;
        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!key) {
            return new NextResponse("Key is required", { status: 400 });
        }

        if (!label) {
            return new NextResponse("Label is required", { status: 400 });
        }

        if (!value) {
            return new NextResponse("Value is required", { status: 400 });
        }

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const labelMap = labelI18n ? buildI18nField(labelI18n) : {};
        const labelPlain = label ?? labelMap.en;

        const stat = await prismadb.stat.create({
            data: {
                key,
                label: labelPlain,
                labelI18n: Object.keys(labelMap).length ? labelMap : undefined,
                value,
                order: order ?? 0,
                isPublished: isPublished ?? true,
                storeId: storeId
            }
        })

        return NextResponse.json(stat);

    } catch (err) {
        console.log(`[STATS_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
        }

        const stats = await prismadb.stat.findMany({
            where: {
                storeId: storeId
            },
            orderBy: {
                order: 'asc'
            }
        })

        return NextResponse.json(stats);

    } catch (err) {
        console.log(`[STATS_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}
