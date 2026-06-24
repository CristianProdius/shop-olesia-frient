export const CUSTOM_ORDER_STATUSES = [
    "new",
    "quoted",
    "accepted",
    "declined",
] as const;

export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number];

// Tailwind utility classes per status (no dedicated `success` token exists in
// this admin, so colors are expressed directly).
export const statusBadgeClass: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    quoted: "bg-yellow-100 text-yellow-800",
    accepted: "bg-emerald-100 text-emerald-800",
    declined: "bg-red-100 text-red-800",
};

export const getStatusBadgeClass = (status: string): string =>
    statusBadgeClass[status] ?? "bg-gray-100 text-gray-800";
