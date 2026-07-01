import { Stat } from "@/types";
import { publishedSorted } from "@/lib/content";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/stats`;

// Lists published stats for the store (public endpoint). We defensively filter
// by `isPublished` and sort by `order` client-side so the store never renders
// unpublished or unordered entries even if the API contract changes.
const getStats = async (): Promise<Stat[]> => {
    try {
        const res = await fetch(URL);
        if (!res.ok) return [];
        const stats: Stat[] = await res.json();
        return publishedSorted(stats);
    } catch {
        return [];
    }
};

export default getStats;
