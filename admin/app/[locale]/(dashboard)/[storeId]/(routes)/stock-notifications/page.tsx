import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { StockNotificationClient } from './components/client'
import { StockNotificationColumn } from './components/columns'

const StockNotificationsPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {

    const { storeId } = await params;
    const notifications = await prismadb.stockNotification.findMany({
        where: {
            storeId: storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Resolve variant -> product/size/color in one batched query (variants live
    // in this same Prisma schema). Falls back to the raw variantId when a
    // variant can no longer be found.
    const variantIds = Array.from(new Set(notifications.map((n) => n.variantId)));
    const variants = await prismadb.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true, size: true, color: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const formatted: StockNotificationColumn[] = notifications.map((item) => {
        const variant = variantMap.get(item.variantId);
        const labelParts = [
            variant?.product?.name,
            variant?.size?.value,
            variant?.color?.name,
        ].filter(Boolean);
        return {
            id: item.id,
            email: item.email,
            variantId: item.variantId,
            variantLabel: labelParts.length ? labelParts.join(' / ') : item.variantId,
            locale: item.locale,
            notified: item.notified,
            createdAt: format(item.createdAt, "MMMM do, yyyy"),
        };
    });

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <StockNotificationClient data={formatted} />
            </div>
        </div>
    )
}

export default StockNotificationsPage;
