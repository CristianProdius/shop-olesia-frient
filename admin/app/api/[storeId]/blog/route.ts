import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import prismadb from "@/lib/prismadb";
import { buildI18nField } from "@/lib/i18n-content";

// CORS headers so the store (a different origin) can fetch the blog. Mirrors
// the public subscribers / reviews routes.
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET (public, CORS): list blog posts for the store. When ?published is set,
// only published posts are returned, ordered by publishedAt; otherwise every
// post is returned (admin list), ordered by createdAt.
export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;
        const { searchParams } = new URL(req.url);
        const publishedOnly = !!searchParams.get("published");

        if (!storeId) {
            return new NextResponse("Store Id is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const posts = await prismadb.blogPost.findMany({
            where: {
                storeId,
                ...(publishedOnly ? { isPublished: true } : {}),
            },
            orderBy: publishedOnly
                ? { publishedAt: "desc" }
                : { createdAt: "desc" },
        });

        return NextResponse.json(posts, { headers: corsHeaders });
    } catch (err) {
        console.log(`[BLOG_GET] ${err}`);
        return new NextResponse(`Internal error`, {
            status: 500,
            headers: corsHeaders,
        });
    }
}

// POST (admin-authed): create a blog post. Auth + store ownership check mirrors
// the products POST route.
export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const {
            slug,
            title,
            titleI18n,
            excerpt,
            excerptI18n,
            content,
            contentI18n,
            coverImage,
            isPublished,
        } = body;

        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", {
                status: 401,
                headers: corsHeaders,
            });
        }

        if (!storeId) {
            return new NextResponse("Store Id is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        if (!slug) {
            return new NextResponse("Slug is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        if (!title) {
            return new NextResponse("Title is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        if (!content) {
            return new NextResponse("Content is required", {
                status: 400,
                headers: corsHeaders,
            });
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", {
                status: 403,
                headers: corsHeaders,
            });
        }

        try {
            const post = await prismadb.blogPost.create({
                data: {
                    storeId,
                    slug,
                    title,
                    titleI18n: titleI18n ? buildI18nField(titleI18n) : undefined,
                    excerpt: excerpt ?? null,
                    excerptI18n: excerptI18n ? buildI18nField(excerptI18n) : undefined,
                    content,
                    contentI18n: contentI18n ? buildI18nField(contentI18n) : undefined,
                    coverImage: coverImage ?? null,
                    isPublished: !!isPublished,
                    publishedAt: isPublished ? new Date() : null,
                },
            });

            return NextResponse.json(post, { headers: corsHeaders });
        } catch (err) {
            if ((err as { code?: string }).code === "P2002") {
                return NextResponse.json(
                    { error: "slug" },
                    { status: 409, headers: corsHeaders }
                );
            }
            throw err;
        }
    } catch (err) {
        console.log(`[BLOG_POST] ${err}`);
        return new NextResponse(`Internal error`, {
            status: 500,
            headers: corsHeaders,
        });
    }
}
