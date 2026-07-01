import prismadb from "@/lib/prismadb";
import { SizeGuideForm } from "./components/size-guide-form";

const SizeGuidePage = async ({
    params
}: {
    params: Promise<{ sizeGuideId: string; storeId: string }>
}) => {
    const { sizeGuideId, storeId } = await params;

    const sizeGuide = await prismadb.sizeGuide.findUnique({
        where: {
            id: sizeGuideId
        }
    });

    const categories = await prismadb.category.findMany({
        where: {
            storeId
        }
    });

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <SizeGuideForm initialData={sizeGuide} categories={categories} />
            </div>
        </div>
    )
}

export default SizeGuidePage;
