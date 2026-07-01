import prismadb from "@/lib/prismadb";
import { getUserId } from '@/lib/server-auth'
import { NextResponse } from "next/server"

export async function GET (
    req: Request,
    { params }: { params: Promise<{ storeId: string, billboardId: string }>}
) {
    try {
        const { storeId, billboardId } = await params;
        if(!billboardId) {
            return new NextResponse("Billboard id is required", { status: 400 });
        }

        const billboard = await prismadb.billboard.findFirst({
            where: {
                id: billboardId,
                storeId,
            }
        })

        return NextResponse.json(billboard);
    } catch (err) {
        console.log('[BILLBOARD_GET]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function PATCH (
    req: Request,
    { params }: { params: Promise<{ storeId: string, billboardId: string }>}
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { storeId, billboardId } = await params;

        const { label, labelI18n, imageUrl } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!label) {
            return new NextResponse("Label is required", { status: 400 });
        }

        // if (!imageUrl) {
        //     return new NextResponse("Image URL is required", { status: 400 });
        // }

        if(!billboardId) {
            return new NextResponse("Billboard id is required", { status: 400 });
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

        const billboard = await prismadb.billboard.updateMany({
            where: {
                id: billboardId,
                storeId
            },
            data: {
                label,
                labelI18n: labelI18n ?? undefined,
                imageUrl
            }
        })

        return NextResponse.json(billboard);
    } catch (err) {
        console.log('[BILLBOARD_PATCH]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

//// Delete Method

export async function DELETE (
    req: Request,
    { params }: { params: Promise<{ storeId: string, billboardId: string }>}
) {
    try {
        const userId = await getUserId();
        const { billboardId, storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if(!billboardId) {
            return new NextResponse("Billboard id is required", { status: 400 });
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

        const billboard = await prismadb.billboard.deleteMany({
            where: {
                id: billboardId,
                storeId
            }
        })

        return NextResponse.json(billboard);
    } catch (err) {
        console.log('[BILLBOARD_DELETE]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}