import { Category } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/categories`

const getCategories = async (): Promise<Category[]> => {
    // Resilient: if the admin API is unreachable or returns non-JSON (e.g. an
    // error page), return [] instead of throwing — keeps the store rendering.
    try {
        const res = await fetch(URL);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export default getCategories;