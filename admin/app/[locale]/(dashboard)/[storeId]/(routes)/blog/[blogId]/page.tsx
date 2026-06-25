import prismadb from "@/lib/prismadb";
import { BlogForm } from "./components/blog-form";

const BlogPostPage = async ({ params }: { params: Promise<{ blogId: string, storeId: string }> }) => {
    const { storeId, blogId } = await params;
    const post = await prismadb.blogPost.findFirst({
        where: {
            id: blogId,
            storeId: storeId
        }
    });

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <BlogForm initialData={post} />
            </div>
        </div>
    )
}

export default BlogPostPage;
