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
    { params }: { params: Promise<{ storeId: string, blogId: string }> }
) {
    try {
        const { storeId, blogId } = await params;
        const userId = await getUserId();

        const post = await prismadb.blogPost.findFirst({
            where: {
                storeId,
                ...(userId ? {} : { isPublished: true }),
                OR: [
                    { id: blogId },
                    { slug: blogId }
                ]
            }
        });

        if (!post) {
            return new NextResponse("Not found", { status: 404, headers: corsHeaders });
        }

        return NextResponse.json(post, { headers: corsHeaders });
    } catch (err) {
        console.log('[BLOG_GET]', err);
        return new NextResponse('Internal error', { status: 500, headers: corsHeaders });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string, blogId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId, blogId } = await params;

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

        const existing = await prismadb.blogPost.findUnique({
            where: {
                id: blogId
            }
        });

        const publishedAt = isPublished
            ? (existing?.publishedAt ?? new Date())
            : existing?.publishedAt ?? null;

        const post = await prismadb.blogPost.update({
            where: {
                id: blogId
            },
            data: {
                slug,
                title,
                titleI18n: titleI18n ?? undefined,
                excerpt: excerpt ?? undefined,
                excerptI18n: excerptI18n ?? undefined,
                content,
                contentI18n: contentI18n ?? undefined,
                coverImage: coverImage ?? undefined,
                isPublished: !!isPublished,
                publishedAt
            }
        });

        return NextResponse.json(post, { headers: corsHeaders });
    } catch (err) {
        if ((err as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: 'slug' }, { status: 409, headers: corsHeaders });
        }

        console.log('[BLOG_PATCH]', err);
        return new NextResponse('Internal error', { status: 500, headers: corsHeaders });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string, blogId: string }> }
) {
    try {
        const userId = await getUserId();
        const { storeId, blogId } = await params;

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

        const post = await prismadb.blogPost.delete({
            where: {
                id: blogId
            }
        });

        return NextResponse.json(post, { headers: corsHeaders });
    } catch (err) {
        console.log('[BLOG_DELETE]', err);
        return new NextResponse('Internal error', { status: 500, headers: corsHeaders });
    }
}
