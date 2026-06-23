import prismadb from "@/lib/prismadb";
import { ContentForm } from "./components/content-form";

const ContentBlockPage = async ({ params }: { params: Promise<{ contentId: string }> }) => {
    const { contentId } = await params
    const contentBlock = await prismadb.contentBlock.findUnique({
        where: {
            id: contentId
        }
    });

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <ContentForm initialData={contentBlock} />
            </div>
        </div>
    )
}

export default ContentBlockPage;
