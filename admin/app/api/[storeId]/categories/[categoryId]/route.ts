import prismadb from "@/lib/prismadb";
import { getUserId } from '@/lib/server-auth'
import { NextResponse } from "next/server"

export async function GET (
    req: Request,
    { params }: { params: Promise<{ categoryId: string }>}
) {
    try {
        const { categoryId } = await params; 
        if(!categoryId) {
            return new NextResponse("Category id is required", { status: 400 });
        }

        const category = await prismadb.category.findUnique({
            where: {
                id: categoryId,
            },
            include: {
                billboard: true
            }
        })

        return NextResponse.json(category);
    } catch (err) {
        console.log('[CATEGORY_GET]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function PATCH (
    req: Request,
    { params }: { params: Promise<{ storeId: string, categoryId: string }>}
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { name, nameI18n, billboardId } = body;
        const { storeId, categoryId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!billboardId) {
            return new NextResponse("Billboard URL is required", { status: 400 });
        }

        if(!categoryId) {
            return new NextResponse("Category id is required", { status: 400 });
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

        const category = await prismadb.category.updateMany({
            where: {
                id: categoryId
            },
            data: {
                name,
                nameI18n: nameI18n ?? undefined,
                billboardId,
            }
        })

        return NextResponse.json(category);
    } catch (err) {
        console.log('[CATEGORY_PATCH]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

//// Delete Method

export async function DELETE (
    req: Request,
    { params }: { params: Promise<{ storeId: string, categoryId: string }>}
) {
    try {
        const userId = await getUserId();
        const { storeId, categoryId } = await params; 

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if(!categoryId) {
            return new NextResponse("Category id is required", { status: 400 });
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

        const category = await prismadb.category.deleteMany({
            where: {
                id: categoryId,
            }
        })

        return NextResponse.json(category);
    } catch (err) {
        console.log('[CATEGORY_DELETE]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}