import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { StatClient } from './components/client'
import { StatColumn } from './components/columns'

const StatsPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {

    const { storeId } = await params;
    const stats = await prismadb.stat.findMany({
        where: {
            storeId: storeId,
        },
        orderBy: {
            order: 'asc'
        }
    })

    const formattedStats: StatColumn[] = stats.map(item => ({
        id: item.id,
        key: item.key,
        label: item.label,
        value: item.value,
        order: item.order,
        isPublished: item.isPublished,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <StatClient data={formattedStats} />
            </div>
        </div>
    )
}

export default StatsPage;
