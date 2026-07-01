import prismadb from "@/lib/prismadb";
import { getUserId } from '@/lib/server-auth'
import { buildI18nField } from "@/lib/i18n-content";
import { NextResponse } from "next/server"

const CONTENT_TYPES = ['brand-story', 'behind-the-scenes', 'why-choose-us', 'social-proof'];

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string, contentId: string }> }
) {
    try {
        const { storeId, contentId } = await params;
        if (!contentId) {
            return new NextResponse("Content id is required", { status: 400 });
        }

        const contentBlock = await prismadb.contentBlock.findFirst({
            where: {
                id: contentId,
                storeId,
            }
        })

        return NextResponse.json(contentBlock);
    } catch (err) {
        console.log('[CONTENT_GET]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string, contentId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { storeId, contentId } = await params;

        const { type, heading, headingI18n, body: bodyText, bodyI18n, mediaUrl, order, isPublished } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!type) {
            return new NextResponse("Type is required", { status: 400 });
        }

        if (!CONTENT_TYPES.includes(type)) {
            return new NextResponse("Invalid type", { status: 400 });
        }

        if (!contentId) {
            return new NextResponse("Content id is required", { status: 400 });
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

        const contentBlock = await prismadb.contentBlock.updateMany({
            where: {
                id: contentId,
                storeId
            },
            data: {
                type,
                heading: headingPlain,
                headingI18n: Object.keys(headingMap).length ? headingMap : undefined,
                body: bodyPlain,
                bodyI18n: Object.keys(bodyMap).length ? bodyMap : undefined,
                mediaUrl: mediaUrl || null,
                order: order ?? 0,
                isPublished: isPublished ?? false,
            }
        })

        return NextResponse.json(contentBlock);
    } catch (err) {
        console.log('[CONTENT_PATCH]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string, contentId: string }> }
) {
    try {
        const userId = await getUserId();
        const { contentId, storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!contentId) {
            return new NextResponse("Content id is required", { status: 400 });
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

        const contentBlock = await prismadb.contentBlock.deleteMany({
            where: {
                id: contentId,
                storeId
            }
        })

        return NextResponse.json(contentBlock);
    } catch (err) {
        console.log('[CONTENT_DELETE]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}
