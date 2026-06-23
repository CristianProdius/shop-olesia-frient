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

        const { category, categoryI18n, question, questionI18n, answer, answerI18n, order, isPublished } = body;
        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!question) {
            return new NextResponse("Question is required", { status: 400 });
        }

        if (!answer) {
            return new NextResponse("Answer is required", { status: 400 });
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

        const categoryMap = categoryI18n ? buildI18nField(categoryI18n) : {};
        const questionMap = questionI18n ? buildI18nField(questionI18n) : {};
        const answerMap = answerI18n ? buildI18nField(answerI18n) : {};

        const categoryPlain = category ?? categoryMap.en ?? null;
        const questionPlain = question ?? questionMap.en;
        const answerPlain = answer ?? answerMap.en;

        const faq = await prismadb.faq.create({
            data: {
                category: categoryPlain,
                categoryI18n: Object.keys(categoryMap).length ? categoryMap : undefined,
                question: questionPlain,
                questionI18n: Object.keys(questionMap).length ? questionMap : undefined,
                answer: answerPlain,
                answerI18n: Object.keys(answerMap).length ? answerMap : undefined,
                order: order ?? 0,
                isPublished: isPublished ?? true,
                storeId: storeId
            }
        })

        return NextResponse.json(faq);

    } catch (err) {
        console.log(`[FAQS_POST] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;

        if (!storeId) {
            return new NextResponse("Store Id is required", { status: 400 });
        }

        const faqs = await prismadb.faq.findMany({
            where: {
                storeId: storeId
            },
            orderBy: {
                order: 'asc'
            }
        })

        return NextResponse.json(faqs);

    } catch (err) {
        console.log(`[FAQS_GET] ${err}`);
        return new NextResponse(`Internal error`, { status: 500 })
    }
}
