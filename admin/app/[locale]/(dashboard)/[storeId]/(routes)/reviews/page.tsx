import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { ReviewClient } from './components/client'
import { ReviewColumn } from './components/columns'

const ReviewsPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {

    const { storeId } = await params;
    const reviews = await prismadb.review.findMany({
        where: {
            storeId: storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Resolve product names for display (no DB FK; relationMode=prisma).
    const productIds = Array.from(new Set(reviews.map((r) => r.productId)));
    const products = await prismadb.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
    });
    const productName = new Map(products.map((p) => [p.id, p.name]));

    const formattedReviews: ReviewColumn[] = reviews.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: productName.get(item.productId) ?? item.productId,
        customerName: item.customerName,
        rating: item.rating,
        status: item.status,
        verified: item.verified,
        source: item.source,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <ReviewClient data={formattedReviews} />
            </div>
        </div>
    )
}

export default ReviewsPage;
