import { getRevenueOrders } from "@/actions/get-revenue-orders";
import { computeMonthlyRevenue, MonthlyRevenuePoint } from "@/lib/analytics";

// Monthly revenue for a trailing window (default: 12 months) computed from real
// order dates and quantity * (unitPrice ?? product.price). Returns the array
// shape the recharts overview expects: { name, total }.
export const getGraphRevenue = async (
  storeId: string,
  months = 12,
): Promise<MonthlyRevenuePoint[]> => {
  const now = new Date();
  // Window start = first day of the earliest month in the range.
  const since = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const orders = await getRevenueOrders(storeId, since);
  return computeMonthlyRevenue(orders, now, months);
};
