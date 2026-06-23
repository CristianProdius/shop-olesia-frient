import prismadb from "@/lib/prismadb";
import { FaqForm } from "./components/faq-form";

const FaqPage = async ({ params }: { params: Promise<{ faqId: string }> }) => {
    const { faqId } = await params
    const faq = await prismadb.faq.findUnique({
        where: {
            id: faqId
        }
    });

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <FaqForm initialData={faq} />
            </div>
        </div>
    )
}

export default FaqPage;
