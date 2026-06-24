import { Review } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/reviews`;

// Fetches approved reviews for a single product (public endpoint). The admin API
// only ever returns `approved` reviews to unauthenticated callers, but we also
// defensively filter client-side so the store never renders pending/rejected
// reviews even if the API contract changes.
const getReviews = async (productId: string): Promise<Review[]> => {
    const res = await fetch(`${URL}?productId=${productId}&status=approved`);
    if (!res.ok) return [];
    const reviews: Review[] = await res.json();
    return reviews.filter((r) => r.status === "approved");
};

export default getReviews;
