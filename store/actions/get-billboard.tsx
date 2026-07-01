import { Billboard } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/billboards`

const getBillboard = async (id: string): Promise<Billboard | null> => {
    // Resilient: if the admin API is unreachable, 404s, or returns non-JSON,
    // return null instead of throwing.
    try {
        const res = await fetch(`${URL}/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default getBillboard;