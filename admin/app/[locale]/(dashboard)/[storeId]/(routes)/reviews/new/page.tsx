import prismadb from "@/lib/prismadb";
import { ReviewForm } from "./components/review-form";

const NewReviewPage = async ({ params }: { params: Promise<{ storeId: string }> }) => {
    const { storeId } = await params;
    const products = await prismadb.product.findMany({
        where: { storeId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <ReviewForm products={products} />
            </div>
        </div>
    )
}

export default NewReviewPage;
