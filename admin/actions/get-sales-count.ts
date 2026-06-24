import { getRevenueOrders } from "@/actions/get-revenue-orders";

// Number of completed sales = count of paid, non-cancelled orders.
export const getSalesCount = async (storeId: string, since?: Date) => {
  const orders = await getRevenueOrders(storeId, since);
  return orders.length;
};
