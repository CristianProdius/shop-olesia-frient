import { format } from "date-fns";
import prismadb from "@/lib/prismadb";
import { CustomOrderClient } from "./components/client";
import { CustomOrderColumn } from "./components/columns";

const CustomOrdersPage = async ({
    params,
}: {
    params: Promise<{ storeId: string }>;
}) => {
    const { storeId } = await params;

    const requests = await prismadb.customOrderRequest.findMany({
        where: {
            storeId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const formatted: CustomOrderColumn[] = requests.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        status: item.status,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <CustomOrderClient data={formatted} />
            </div>
        </div>
    );
};

export default CustomOrdersPage;
