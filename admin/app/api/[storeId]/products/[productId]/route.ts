import prismadb from "@/lib/prismadb";
import { getUserId } from '@/lib/server-auth'
import { NextResponse } from "next/server"
import { buildI18nField } from "@/lib/i18n-content";

export async function GET (
    req: Request,
    { params }: { params: Promise<{ productId: string }>}
) {
    try {
        const { productId } = await params; 

        if(!productId) {
            return new NextResponse("Product id is required", { status: 400 });
        }

        const product = await prismadb.product.findUnique({
            where: {
                id: productId,
            },
            include: {
                images: true,
                category: true,
                size: true,
                color: true
            }
        })

        return NextResponse.json(product);
    } catch (err) {
        console.log('[PRODUCT_GET]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function PATCH (
    req: Request,
    { params }: { params: Promise<{ storeId: string, productId: string }>}
) {
    try {
        const userId = await getUserId();
        const body = await req.json();
        const { storeId, productId } = await params; 

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
            isFeatured,
            isArchived
        } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
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

        if (!images || !images.length) {
            return new NextResponse("Image is required", { status: 400});
        }

        if(!productId) {
            return new NextResponse("Product id is required", { status: 400 });
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

        await prismadb.product.update({
            where: {
                id: productId
            },
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
                    deleteMany: {}
                },
                price,
                isFeatured,
                isArchived,
                categoryId,
                sizeId,
                colorId,
                storeId: storeId
            }
        })

        const product = await prismadb.product.update({
            where: {
                id: productId
            },
            data: {
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: { url: string }) => image)
                        ]
                    }
                }
            }
        })

        return NextResponse.json(product);
    } catch (err) {
        console.log('[PRODUCT_PATCH]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

//// Delete Method

export async function DELETE (
    req: Request,
    { params }: { params: Promise<{ storeId: string, productId: string }>}
) {
    try {
        const userId = await getUserId();
        const { storeId, productId } = await params; 

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if(!productId) {
            return new NextResponse("Product id is required", { status: 400 });
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

        const product = await prismadb.product.deleteMany({
            where: {
                id: productId,
            }
        })

        return NextResponse.json(product);
    } catch (err) {
        console.log('[PRODUCT_DELETE]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}