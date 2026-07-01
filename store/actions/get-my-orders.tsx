import { Order } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/orders`;

// Fetches the signed-in customer's orders from the admin API, scoped by
// customerId. The admin endpoint returns only this customer's orders to
// unauthenticated (storefront) callers. Returns [] on any error so the
// account hub degrades gracefully.
//
// NOTE: this only covers logged-in customers. Guest orders are created with a
// null customerId (guest checkout, "no login required"), so they never appear
// here. A guest retrieves their order via the lookup endpoint
// (/orders/lookup?email=...&orderId=...), matching on the email + order id they
// were given at checkout.
const getMyOrders = async (customerId: string): Promise<Order[]> => {
    if (!customerId) return [];
    const res = await fetch(`${URL}?customerId=${encodeURIComponent(customerId)}`, {
        cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
};

export default getMyOrders;
