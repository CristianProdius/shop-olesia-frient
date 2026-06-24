import prismadb from "@/lib/prismadb";
import { CustomOrderDetail } from "./components/custom-order-detail";

const CustomOrderPage = async ({
    params,
}: {
    params: Promise<{ requestId: string; storeId: string }>;
}) => {
    const { requestId, storeId } = await params;

    const request = await prismadb.customOrderRequest.findFirst({
        where: {
            id: requestId,
            storeId,
        },
    });

    if (!request) {
        return (
            <div className="flex-col">
                <div className="flex-1 p-8 pt-6 space-y-4">
                    Request not found
                </div>
            </div>
        );
    }

    const initialData = {
        id: request.id,
        name: request.name,
        email: request.email,
        phone: request.phone,
        message: request.message,
        measurements: request.measurements ?? "",
        locale: request.locale,
        status: request.status,
    };

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <CustomOrderDetail initialData={initialData} />
            </div>
        </div>
    );
};

export default CustomOrderPage;
