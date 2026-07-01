import { Size } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/sizes`

const getSizes = async (): Promise<Size[]> => {
    // Resilient: if the admin API is unreachable or returns non-JSON,
    // return [] instead of throwing — keeps the store rendering.
    try {
        const res = await fetch(URL);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export default getSizes;