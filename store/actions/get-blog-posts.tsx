import { BlogPost } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/blog?published=1`;

const getBlogPosts = async (): Promise<BlogPost[]> => {
    try {
        const res = await fetch(URL);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export default getBlogPosts;
