import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { SubscriberClient } from './components/client'
import { SubscriberColumn } from './components/columns'

const SubscribersPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {

    const { storeId } = await params;
    const subscribers = await prismadb.subscriber.findMany({
        where: {
            storeId: storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    const formattedSubscribers: SubscriberColumn[] = subscribers.map(item => ({
        id: item.id,
        email: item.email,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <SubscriberClient data={formattedSubscribers} />
            </div>
        </div>
    )
}

export default SubscribersPage;
