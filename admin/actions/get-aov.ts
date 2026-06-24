import { getRevenueOrders } from "@/actions/get-revenue-orders";
import { computeAOV } from "@/lib/analytics";

// Average order value (USD) = total revenue / number of paid orders.
// Returns 0 when there are no orders (divide-by-zero guard in computeAOV).
export const getAOV = async (storeId: string, since?: Date) => {
  const orders = await getRevenueOrders(storeId, since);
  return computeAOV(orders);
};
