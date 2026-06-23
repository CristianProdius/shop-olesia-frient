import { Faq } from "@/types";
import { publishedSorted } from "@/lib/content";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/faqs`;

// Lists published FAQs for the store (public endpoint). We defensively filter by
// `isPublished` and sort by `order` client-side so the store never renders
// unpublished or unordered entries even if the API contract changes.
const getFaqs = async (): Promise<Faq[]> => {
    const res = await fetch(URL);
    if (!res.ok) return [];
    const faqs: Faq[] = await res.json();
    return publishedSorted(faqs);
};

export default getFaqs;
