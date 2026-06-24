import { getRevenueOrders } from "@/actions/get-revenue-orders";
import { computeTopProducts, TopProduct } from "@/lib/analytics";

// Top N products by units sold over paid, non-cancelled orders.
// Each entry: { name, units, revenue } (revenue in USD).
export const getTopProducts = async (
  storeId: string,
  limit = 5,
  since?: Date,
): Promise<TopProduct[]> => {
  const orders = await getRevenueOrders(storeId, since);
  return computeTopProducts(orders, limit);
};
