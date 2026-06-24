import prismadb from "@/lib/prismadb";
import { AnalyticsOrder, isRevenueOrder } from "@/lib/analytics";

// Fetches the store's revenue-bearing orders (paid or in a paid/packed/shipped/
// delivered status, excluding cancelled) and maps them to the plain shape the
// pure analytics helpers consume. Order items always carry the product's
// current price so legacy null `unitPrice` rows can fall back to it.
//
// `since` optionally limits orders to those created on/after a date.
export const getRevenueOrders = async (
  storeId: string,
  since?: Date,
): Promise<AnalyticsOrder[]> => {
  const orders = await prismadb.order.findMany({
    where: {
      storeId,
      status: { not: "cancelled" },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  return orders
    .filter((order) => isRevenueOrder(order))
    .map((order) => ({
      createdAt: order.createdAt,
      isPaid: order.isPaid,
      status: order.status,
      items: order.orderItems.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice === null ? null : Number(item.unitPrice),
        productPrice: Number(item.product.price),
      })),
    }));
};
