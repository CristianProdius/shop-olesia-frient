import { BlogPost } from "@/types";

const URL = `${process.env.NEXT_PUBLIC_API_URL}/blog`;

const getBlogPost = async (slug: string): Promise<BlogPost | null> => {
    try {
        const res = await fetch(`${URL}/${slug}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default getBlogPost;
