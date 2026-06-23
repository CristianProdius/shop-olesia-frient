import prismadb from "@/lib/prismadb";
import { getUserId } from '@/lib/server-auth'
import { buildI18nField } from "@/lib/i18n-content";
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ faqId: string }> }
) {
    try {
        const { faqId } = await params;
        if (!faqId) {
            return new NextResponse("Faq id is required", { status: 400 });
        }

        const faq = await prismadb.faq.findUnique({
            where: {
                id: faqId,
            }
        })

        return NextResponse.json(faq);
    } catch (err) {
        console.log('[FAQ_GET]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string, faqId: string }> }
) {
    try {
        const userId = await getUserId();
        const body = await req.json();

        const { storeId, faqId } = await params;

        const { category, categoryI18n, question, questionI18n, answer, answerI18n, order, isPublished } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!question) {
            return new NextResponse("Question is required", { status: 400 });
        }

        if (!answer) {
            return new NextResponse("Answer is required", { status: 400 });
        }

        if (!faqId) {
            return new NextResponse("Faq id is required", { status: 400 });
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

        const categoryMap = categoryI18n ? buildI18nField(categoryI18n) : {};
        const questionMap = questionI18n ? buildI18nField(questionI18n) : {};
        const answerMap = answerI18n ? buildI18nField(answerI18n) : {};

        const categoryPlain = category ?? categoryMap.en ?? null;
        const questionPlain = question ?? questionMap.en;
        const answerPlain = answer ?? answerMap.en;

        const faq = await prismadb.faq.updateMany({
            where: {
                id: faqId
            },
            data: {
                category: categoryPlain,
                categoryI18n: Object.keys(categoryMap).length ? categoryMap : undefined,
                question: questionPlain,
                questionI18n: Object.keys(questionMap).length ? questionMap : undefined,
                answer: answerPlain,
                answerI18n: Object.keys(answerMap).length ? answerMap : undefined,
                order: order ?? 0,
                isPublished: isPublished ?? true,
            }
        })

        return NextResponse.json(faq);
    } catch (err) {
        console.log('[FAQ_PATCH]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string, faqId: string }> }
) {
    try {
        const userId = await getUserId();
        const { faqId, storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!faqId) {
            return new NextResponse("Faq id is required", { status: 400 });
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

        const faq = await prismadb.faq.deleteMany({
            where: {
                id: faqId,
            }
        })

        return NextResponse.json(faq);
    } catch (err) {
        console.log('[FAQ_DELETE]', err)
        return new NextResponse('Internal error', { status: 500 })
    }
}
