import { Category } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/categories`

const getCategory = async (id: string): Promise<Category | null> => {
    // Resilient: if the admin API is unreachable, 404s, or returns non-JSON,
    // return null instead of throwing — callers render notFound() on null.
    try {
        const res = await fetch(`${URL}/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default getCategory;