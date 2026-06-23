import { NextResponse } from "next/server";
import { getUserId } from '@/lib/server-auth'
import prismadb from "@/lib/prismadb";
import { buildI18nField } from "@/lib/i18n-content";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const {
            name,
            nameI18n,
            sku,
            description,
            descriptionI18n,
            material,
            materialI18n,
            care,
            careI18n,
            price,
            categoryId,
            colorId,
            sizeId,
            images,
            variants,
            isFeatured,
            isArchived
        } = body;

        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400});
        }

        if (!price) new NextResponse("Price is required", { status: 400});

        if (!categoryId) new NextResponse("Category id is required", { status: 400});

        if (!colorId) new NextResponse("Color id is required", { status: 400});

        if (!sizeId) new NextResponse("Size id is required", { status: 400});

        if (!isFeatured) new NextResponse("Featured is required", { status: 400});

        if (!isArchived) new NextResponse("Archived is required", { status: 400});

        // if (!images || !images.length) {
        //     return new NextResponse("Image is required", { status: 400});
        // }

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

        // Build i18n JSON maps from the per-locale form inputs (dropping blanks),
        // and persist a plain default-locale (en) fallback column alongside each,
        // mirroring the name / nameI18n convention.
        const descriptionMap = descriptionI18n ? buildI18nField(descriptionI18n) : {};
        const materialMap = materialI18n ? buildI18nField(materialI18n) : {};
        const careMap = careI18n ? buildI18nField(careI18n) : {};

        const descriptionPlain = description ?? descriptionMap.en ?? null;
        const materialPlain = material ?? materialMap.en ?? null;
        const carePlain = care ?? careMap.en ?? null;

        const product = await prismadb.product.create({
            data : {
                name,
                nameI18n: nameI18n ? buildI18nField(nameI18n) : undefined,
                sku: sku || null,
                description: descriptionPlain,
                descriptionI18n: Object.keys(descriptionMap).length ? descriptionMap : undefined,
                material: materialPlain,
                materialI18n: Object.keys(materialMap).length ? materialMap : undefined,
                care: carePlain,
                careI18n: Object.keys(careMap).length ? careMap : undefined,
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: { url:string }) => image)
                        ]
                    }
                },
                variants: variants && variants.length ? {
                    createMany: {
                        data: [
                            ...variants.map((variant: { sizeId: string; colorId: string; sku?: string | null; stockQty: number }) => ({
                                sizeId: variant.sizeId,
                                colorId: variant.colorId,
                                sku: variant.sku || null,
                                stockQty: variant.stockQty,
                            }))
                        ]
                    }
                } : undefined,
                price,
                isFeatured,
                isArchived,
                categoryId,
                sizeId,
                colorId,
                storeId: storeId
            }
        })

        return NextResponse.json(product);

    } catch (err) {
        console.log(`[PRODUCTS_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500})
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params; 
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId') || undefined;
        const sizeId = searchParams.get('sizeId') || undefined;
        const colorId = searchParams.get('colorId') || undefined;
        const isFeatured = searchParams.get('isFeatured');

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400});
        }

        const products = await prismadb.product.findMany({
            where: {
                storeId: storeId,
                categoryId,
                colorId,
                sizeId,
                isFeatured: isFeatured ? true : undefined,
                isArchived: false
            },
            include: {
                images: true,
                category: true,
                color: true,
                size: true,
                variants: {
                    include: {
                        size: true,
                        color: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(products);

    } catch (err) {
        console.log(`[PRODUCTS_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500})
    }
}