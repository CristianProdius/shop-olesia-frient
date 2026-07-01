import prismadb from "@/lib/prismadb";
import { getUserId } from "@/lib/server-auth";
import { buildI18nField } from "@/lib/i18n-content";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string; sizeGuideId: string }> }
) {
    try {
        const { storeId, sizeGuideId } = await params;
        if (!sizeGuideId) {
            return new NextResponse("Size guide id is required", { status: 400 });
        }

        const sizeGuide = await prismadb.sizeGuide.findFirst({
            where: {
                id: sizeGuideId,
                storeId
            }
        })

        return NextResponse.json(sizeGuide);
    } catch (err) {
        console.log("[SIZE_GUIDE_GET]", err);
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string; sizeGuideId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();
        const { storeId, sizeGuideId } = await params;

        const { categoryId, title, titleI18n, columnsI18n, rows, order, isPublished } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!categoryId) {
            return new NextResponse("Category is required", { status: 400 });
        }

        if (!sizeGuideId) {
            return new NextResponse("Size guide id is required", { status: 400 });
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

        const titleMap = titleI18n ? buildI18nField(titleI18n) : {};
        const titlePlain = title ?? titleMap.en ?? null;

        const sizeGuide = await prismadb.sizeGuide.updateMany({
            where: {
                id: sizeGuideId,
                storeId
            },
            data: {
                categoryId,
                title: titlePlain,
                titleI18n: Object.keys(titleMap).length ? titleMap : undefined,
                columnsI18n: columnsI18n ?? undefined,
                rows: rows ?? undefined,
                order: order ?? 0,
                isPublished: isPublished ?? true,
            }
        })

        return NextResponse.json(sizeGuide);
    } catch (err) {
        console.log("[SIZE_GUIDE_PATCH]", err);
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string; sizeGuideId: string }> }
) {
    try {
        const userId = await getUserId();
        const { sizeGuideId, storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!sizeGuideId) {
            return new NextResponse("Size guide id is required", { status: 400 });
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

        const sizeGuide = await prismadb.sizeGuide.deleteMany({
            where: {
                id: sizeGuideId,
                storeId
            }
        })

        return NextResponse.json(sizeGuide);
    } catch (err) {
        console.log("[SIZE_GUIDE_DELETE]", err);
        return new NextResponse("Internal error", { status: 500 })
    }
}
