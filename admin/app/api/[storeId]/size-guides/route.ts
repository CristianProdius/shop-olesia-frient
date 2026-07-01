import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";
import { buildI18nField } from "@/lib/i18n-content";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { categoryId, title, titleI18n, columnsI18n, rows, order, isPublished } = body;
        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!categoryId) {
            return new NextResponse("Category is required", { status: 400 });
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

        const titleMap = titleI18n ? buildI18nField(titleI18n) : {};
        const titlePlain = title ?? titleMap.en ?? null;

        const sizeGuide = await prismadb.sizeGuide.create({
            data: {
                categoryId,
                title: titlePlain,
                titleI18n: Object.keys(titleMap).length ? titleMap : undefined,
                columnsI18n: columnsI18n ?? undefined,
                rows: rows ?? undefined,
                order: order ?? 0,
                isPublished: isPublished ?? true,
                storeId
            }
        })

        return NextResponse.json(sizeGuide);
    } catch (err) {
        console.log(`[SIZE_GUIDES_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const userId = await getUserId();

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") || undefined;

        const where: { storeId: string; categoryId?: string; isPublished?: boolean } = {
            storeId
        };
        if (categoryId) where.categoryId = categoryId;
        if (!userId) where.isPublished = true;

        const sizeGuides = await prismadb.sizeGuide.findMany({
            where,
            orderBy: {
                order: "asc"
            }
        })

        return NextResponse.json(sizeGuides);
    } catch (err) {
        console.log(`[SIZE_GUIDES_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}
