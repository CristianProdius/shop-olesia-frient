import { SizeGuide } from "@/types";
import { publishedSorted } from "@/lib/content";
import qs from "query-string";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/size-guides`;

// Lists published size guides for the store (public endpoint), optionally
// scoped to a category. Defensively filters by `isPublished` and sorts by
// `order` client-side so the store never renders unpublished/unordered guides.
const getSizeGuides = async (categoryId?: string): Promise<SizeGuide[]> => {
    const url = qs.stringifyUrl({
        url: URL,
        query: { categoryId },
    });
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const guides: SizeGuide[] = await res.json();
        return publishedSorted(guides);
    } catch {
        return [];
    }
};

export default getSizeGuides;
