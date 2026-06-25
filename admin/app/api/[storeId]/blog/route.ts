import { NextResponse } from "next/server";
import { getUserId } from '@/lib/server-auth'
import prismadb from "@/lib/prismadb";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { searchParams } = new URL(req.url);

        const where = {
            storeId,
            ...(searchParams.get('published') ? { isPublished: true } : {})
        };

        const posts = await prismadb.blogPost.findMany({
            where,
            orderBy: searchParams.get('published')
                ? { publishedAt: 'desc' }
                : { createdAt: 'desc' }
        });

        return NextResponse.json(posts, { headers: corsHeaders });
    } catch (err) {
        console.log('[BLOG_GET]', err);
        return new NextResponse('Internal error', { status: 500, headers: corsHeaders });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId } = await params;

        const {
            slug,
            title,
            titleI18n,
            excerpt,
            excerptI18n,
            content,
            contentI18n,
            coverImage,
            isPublished
        } = await req.json();

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401, headers: corsHeaders });
        }

        const store = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId
            }
        });

        if (!store) {
            return new NextResponse("Unauthorized", { status: 403, headers: corsHeaders });
        }

        if (!slug) {
            return new NextResponse("Slug is required", { status: 400, headers: corsHeaders });
        }

        if (!title) {
            return new NextResponse("Title is required", { status: 400, headers: corsHeaders });
        }

        if (!content) {
            return new NextResponse("Content is required", { status: 400, headers: corsHeaders });
        }

        const post = await prismadb.blogPost.create({
            data: {
                storeId,
                slug,
                title,
                titleI18n: titleI18n ?? undefined,
                excerpt: excerpt ?? undefined,
                excerptI18n: excerptI18n ?? undefined,
                content,
                contentI18n: contentI18n ?? undefined,
                coverImage: coverImage ?? undefined,
                isPublished: !!isPublished,
                publishedAt: isPublished ? new Date() : null
            }
        });

        return NextResponse.json(post, { headers: corsHeaders });
    } catch (err) {
        if ((err as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: 'slug' }, { status: 409, headers: corsHeaders });
        }

        console.log('[BLOG_POST]', err);
        return new NextResponse('Internal error', { status: 500, headers: corsHeaders });
    }
}
