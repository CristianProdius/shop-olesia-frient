import prismadb from "@/lib/prismadb";
import { OrderDetail } from "./components/order-detail";

const OrderPage = async ({
    params,
}: {
    params: Promise<{ orderId: string; storeId: string }>;
}) => {
    const { orderId, storeId } = await params;

    const order = await prismadb.order.findFirst({
        where: {
            id: orderId,
            storeId,
        },
        include: {
            orderItems: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!order) {
        return (
            <div className="flex-col">
                <div className="flex-1 p-8 pt-6 space-y-4">Order not found</div>
            </div>
        );
    }

    const items = order.orderItems.map((item) => {
        const unitPrice =
            item.unitPrice != null
                ? Number(item.unitPrice)
                : Number(item.product.price);
        return {
            id: item.id,
            productName: item.product.name,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
        };
    });

    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

    const initialData = {
        id: order.id,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        address: order.address,
        locale: order.locale,
        isPaid: order.isPaid,
        status: order.status,
        carrier: order.carrier ?? "",
        trackingNumber: order.trackingNumber ?? "",
        items,
        total,
    };

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <OrderDetail initialData={initialData} />
            </div>
        </div>
    );
};

export default OrderPage;
