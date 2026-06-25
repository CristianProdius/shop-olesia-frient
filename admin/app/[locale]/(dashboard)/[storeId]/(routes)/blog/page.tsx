import { format } from 'date-fns'
import prismadb from '@/lib/prismadb'
import { BlogClient } from './components/client'
import { BlogColumn } from './components/columns'

const BlogPage = async ({
    params
}: {
    params: Promise<{ storeId: string }>
}) => {

    const { storeId } = await params;
    const posts = await prismadb.blogPost.findMany({
        where: {
            storeId: storeId,
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    const formattedPosts: BlogColumn[] = posts.map(item => ({
        id: item.id,
        title: item.title,
        status: item.isPublished,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 p-8 pt-6 space-y-4">
                <BlogClient data={formattedPosts} />
            </div>
        </div>
    )
}

export default BlogPage;
