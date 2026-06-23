import prismadb from "@/lib/prismadb";
import { StatForm } from "./components/stat-form";

const StatPage = async ({ params }: { params: Promise<{ statId: string }> }) => {
    const { statId } = await params
    const stat = await prismadb.stat.findUnique({
        where: {
            id: statId
        }
    });

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <StatForm initialData={stat} />
            </div>
        </div>
    )
}

export default StatPage;
