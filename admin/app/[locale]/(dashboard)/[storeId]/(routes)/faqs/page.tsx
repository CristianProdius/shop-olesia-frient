import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { FaqClient } from './components/client'
import { FaqColumn } from './components/columns'

const FaqsPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {

    const { storeId } = await params;
    const faqs = await prismadb.faq.findMany({
        where: {
            storeId: storeId,
        },
        orderBy: {
            order: 'asc'
        }
    })

    const formattedFaqs: FaqColumn[] = faqs.map(item => ({
        id: item.id,
        question: item.question,
        category: item.category ?? '',
        order: item.order,
        isPublished: item.isPublished,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <FaqClient data={formattedFaqs} />
            </div>
        </div>
    )
}

export default FaqsPage;
