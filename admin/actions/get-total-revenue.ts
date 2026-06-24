import { getRevenueOrders } from "@/actions/get-revenue-orders";
import { computeTotalRevenue } from "@/lib/analytics";

// Total revenue (USD) across paid, non-cancelled orders, summed over their line
// items as quantity * (unitPrice ?? product.price).
export const getTotalRevenue = async (storeId: string, since?: Date) => {
  const orders = await getRevenueOrders(storeId, since);
  return computeTotalRevenue(orders);
};
