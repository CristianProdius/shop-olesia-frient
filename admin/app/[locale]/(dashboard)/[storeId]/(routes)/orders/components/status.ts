export const ORDER_STATUSES = [
    "pending",
    "paid",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Tailwind utility classes per status (no dedicated `success` token exists in
// this admin, so colors are expressed directly).
export const statusBadgeClass: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-emerald-100 text-emerald-800",
    packed: "bg-blue-100 text-blue-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
};

export const getStatusBadgeClass = (status: string): string =>
    statusBadgeClass[status] ?? "bg-gray-100 text-gray-800";
