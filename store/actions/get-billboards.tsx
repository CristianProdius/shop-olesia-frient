import { Billboard } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/billboards`;

// Lists all billboards for the store (public endpoint). Used by the home page
// to show a hero without hardcoding a billboard id.
const getBillboards = async (): Promise<Billboard[]> => {
    try {
        const res = await fetch(URL);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
};

export default getBillboards;
