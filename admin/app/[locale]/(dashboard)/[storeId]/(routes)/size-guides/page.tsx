import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { SizeGuideClient } from './components/client'
import { SizeGuideColumn } from './components/columns'

const SizeGuidesPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {
    const { storeId } = await params;

    const guides = await prismadb.sizeGuide.findMany({
        where: {
            storeId
        },
        orderBy: {
            order: 'asc'
        }
    })

    const categories = await prismadb.category.findMany({
        where: {
            storeId
        }
    })

    const categoryName = (id: string) =>
        categories.find((c) => c.id === id)?.name ?? '';

    const formatted: SizeGuideColumn[] = guides.map(item => ({
        id: item.id,
        title: item.title ?? '',
        category: categoryName(item.categoryId),
        order: item.order,
        isPublished: item.isPublished,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <SizeGuideClient data={formatted} />
            </div>
        </div>
    )
}

export default SizeGuidesPage;
