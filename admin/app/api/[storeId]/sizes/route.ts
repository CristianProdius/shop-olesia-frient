import { NextResponse } from "next/server";
import { getUserId } from '@/lib/server-auth'
import prismadb from "@/lib/prismadb";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();
        const { storeId } = await params; 

        const { name, value, nameI18n } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400});
        }

        if (!value) {
            return new NextResponse("Value is required", { status: 400});
        }

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400});
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

        const size = await prismadb.size.create({
            data : {
                name,
                value,
                nameI18n: nameI18n ?? undefined,
                storeId: storeId
            }
        })

        return NextResponse.json(size);

    } catch (err) {
        console.log(`[SIZES_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500})
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params; 
        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400});
        }

        const sizes = await prismadb.size.findMany({
            where: {
                storeId: storeId
            }
        })

        return NextResponse.json(sizes);

    } catch (err) {
        console.log(`[SIZES_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500})
    }
}