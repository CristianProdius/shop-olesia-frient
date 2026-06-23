import { ContentBlock } from "@/types";
import { publishedSorted } from "@/lib/content";
import qs from "query-string";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/content`;

// Lists published content blocks for the store (public endpoint). The admin
// content API supports a `?type=` filter; we still defensively filter by
// `isPublished` and sort by `order` client-side so the store never renders
// unpublished or unordered content even if the API contract changes.
const getContentBlocks = async (type?: string): Promise<ContentBlock[]> => {
    const url = qs.stringifyUrl({
        url: URL,
        query: { type },
    });
    const res = await fetch(url);
    if (!res.ok) return [];
    const blocks: ContentBlock[] = await res.json();
    return publishedSorted(blocks);
};

export default getContentBlocks;
