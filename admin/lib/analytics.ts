// Pure aggregation helpers for store analytics.
//
// These functions operate on already-fetched order data so the logic stays
// testable and free of Prisma/DB concerns. Revenue and unit math always use
// `quantity * (unitPrice ?? product.price)` so legacy rows (null unitPrice)
// fall back to the product's current price.
//
// Admin revenue is intentionally reported in USD (see design notes); these
// helpers return plain numbers and leave currency formatting to the caller.

// Order statuses that count toward revenue even when the legacy `isPaid`
// boolean is not set. `cancelled` is always excluded.
const REVENUE_STATUSES = ["paid", "packed", "shipped", "delivered"];

export interface AnalyticsOrderItem {
  quantity: number;
  unitPrice: number | null;
  productPrice: number;
}

export interface AnalyticsProductRef {
  productId: string;
  name: string;
}

export interface AnalyticsOrder {
  createdAt: Date;
  isPaid: boolean;
  status: string;
  items: (AnalyticsOrderItem & AnalyticsProductRef)[];
}

export interface MonthlyRevenuePoint {
  name: string;
  total: number;
}

export interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// An order counts toward revenue if it is paid (legacy flag) or has reached a
// revenue-bearing fulfillment status, and is not cancelled.
export const isRevenueOrder = (order: {
  isPaid: boolean;
  status: string;
}): boolean => {
  if (order.status === "cancelled") return false;
  return order.isPaid || REVENUE_STATUSES.includes(order.status);
};

// Revenue contributed by a single line item: quantity * effective unit price.
export const lineRevenue = (item: AnalyticsOrderItem): number => {
  const unit = item.unitPrice ?? item.productPrice;
  return item.quantity * unit;
};

// Total revenue across the supplied revenue-bearing orders.
export const computeTotalRevenue = (orders: AnalyticsOrder[]): number =>
  orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((orderSum, item) => orderSum + lineRevenue(item), 0),
    0,
  );

// Average order value = total revenue / number of revenue orders.
// Guards divide-by-zero by returning 0 for an empty set.
export const computeAOV = (orders: AnalyticsOrder[]): number => {
  if (orders.length === 0) return 0;
  return computeTotalRevenue(orders) / orders.length;
};

// Monthly revenue for a trailing window of `months` ending at `now`.
// Returns one point per month in chronological order, e.g. "Jul 25".
export const computeMonthlyRevenue = (
  orders: AnalyticsOrder[],
  now: Date,
  months: number,
): MonthlyRevenuePoint[] => {
  // Build the ordered list of buckets (oldest -> newest).
  const buckets: { key: string; label: string; total: number }[] = [];
  const indexByKey = new Map<string, number>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label =
      months > 12
        ? `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`
        : MONTH_LABELS[d.getMonth()];
    indexByKey.set(key, buckets.length);
    buckets.push({ key, label, total: 0 });
  }

  for (const order of orders) {
    const created = order.createdAt;
    const key = `${created.getFullYear()}-${created.getMonth()}`;
    const idx = indexByKey.get(key);
    if (idx === undefined) continue; // outside the window
    for (const item of order.items) {
      buckets[idx].total += lineRevenue(item);
    }
  }

  return buckets.map((b) => ({ name: b.label, total: b.total }));
};

// Top N products by units sold (default) over the supplied orders.
export const computeTopProducts = (
  orders: AnalyticsOrder[],
  limit: number,
): TopProduct[] => {
  const byProduct = new Map<string, TopProduct>();

  for (const order of orders) {
    for (const item of order.items) {
      const existing = byProduct.get(item.productId) ?? {
        name: item.name,
        units: 0,
        revenue: 0,
      };
      existing.units += item.quantity;
      existing.revenue += lineRevenue(item);
      byProduct.set(item.productId, existing);
    }
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, limit);
};
