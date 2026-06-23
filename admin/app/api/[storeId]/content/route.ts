import { NextResponse } from "next/server";
import { getUserId } from '@/lib/server-auth'
import prismadb from "@/lib/prismadb";
import { buildI18nField } from "@/lib/i18n-content";

const CONTENT_TYPES = ['brand-story', 'behind-the-scenes', 'why-choose-us', 'social-proof'];

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { type, heading, headingI18n, body: bodyText, bodyI18n, mediaUrl, order, isPublished } = body;
        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!type) {
            return new NextResponse("Type is required", { status: 400 });
        }

        if (!CONTENT_TYPES.includes(type)) {
            return new NextResponse("Invalid type", { status: 400 });
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

        const headingMap = headingI18n ? buildI18nField(headingI18n) : {};
        const bodyMap = bodyI18n ? buildI18nField(bodyI18n) : {};

        const headingPlain = heading ?? headingMap.en ?? null;
        const bodyPlain = bodyText ?? bodyMap.en ?? null;

        const contentBlock = await prismadb.contentBlock.create({
            data: {
                type,
                heading: headingPlain,
                headingI18n: Object.keys(headingMap).length ? headingMap : undefined,
                body: bodyPlain,
                bodyI18n: Object.keys(bodyMap).length ? bodyMap : undefined,
                mediaUrl: mediaUrl || null,
                order: order ?? 0,
                isPublished: isPublished ?? false,
                storeId: storeId
            }
        })

        return NextResponse.json(contentBlock);

    } catch (err) {
        console.log(`[CONTENT_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || undefined;

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
        }

        const contentBlocks = await prismadb.contentBlock.findMany({
            where: {
                storeId: storeId,
                type
            },
            orderBy: {
                order: 'asc'
            }
        })

        return NextResponse.json(contentBlocks);

    } catch (err) {
        console.log(`[CONTENT_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}
