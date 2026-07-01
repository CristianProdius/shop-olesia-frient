import prismadb from "@/lib/prismadb";
import { getUserId } from '@/lib/server-auth'
import { buildI18nField } from "@/lib/i18n-content";
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string, statId: string }> }
) {
    try {
        const { storeId, statId } = await params;
        if (!statId) {
            return new NextResponse("Stat id is required", { status: 400 });
        }

        const stat = await prismadb.stat.findFirst({
            where: {
                id: statId,
                storeId,
            }
        })

        return NextResponse.json(stat);
    } catch (err) {
        console.log('[STAT_GET]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string, statId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { storeId, statId } = await params;

        const { key, label, labelI18n, value, order, isPublished } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
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

        if (!statId) {
            return new NextResponse("Stat id is required", { status: 400 });
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

        const stat = await prismadb.stat.updateMany({
            where: {
                id: statId,
                storeId
            },
            data: {
                key,
                label: labelPlain,
                labelI18n: Object.keys(labelMap).length ? labelMap : undefined,
                value,
                order: order ?? 0,
                isPublished: isPublished ?? true,
            }
        })

        return NextResponse.json(stat);
    } catch (err) {
        console.log('[STAT_PATCH]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string, statId: string }> }
) {
    try {
        const userId = await getUserId();
        const { statId, storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!statId) {
            return new NextResponse("Stat id is required", { status: 400 });
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

        const stat = await prismadb.stat.deleteMany({
            where: {
                id: statId,
                storeId
            }
        })

        return NextResponse.json(stat);
    } catch (err) {
        console.log('[STAT_DELETE]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}
