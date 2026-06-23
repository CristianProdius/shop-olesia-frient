import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { ContentClient } from './components/client'
import { ContentColumn } from './components/columns'

const ContentPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {

    const { storeId } = await params;
    const contentBlocks = await prismadb.contentBlock.findMany({
        where: {
            storeId: storeId,
        },
        orderBy: {
            order: 'asc'
        }
    })

    const formattedContent: ContentColumn[] = contentBlocks.map(item => ({
        id: item.id,
        type: item.type,
        heading: item.heading ?? '',
        order: item.order,
        isPublished: item.isPublished,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <ContentClient data={formattedContent} />
            </div>
        </div>
    )
}

export default ContentPage;
