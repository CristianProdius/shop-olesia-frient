import { getUserId } from '@/lib/server-auth'
import { redirect } from "next/navigation"
import prismadb from "@/lib/prismadb";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";

interface DashboardType {
    children: React.ReactNode;
    params: Promise<{ storeId: string }>
}

export default async function Dashboard({children, params}: DashboardType) {
    const userId = await getUserId();
    const { storeId } = await params;

    if (!userId) {
        redirect('/sign-in')
    }

    const store = await prismadb?.store.findFirst({
        where: {
            id: storeId,
            userId
        }
    })

    if (!store) {
        redirect('/');
    }

    const stores = await prismadb?.store.findMany({
        where: {
            userId,
        }
    })

    return (
        <div className="flex min-h-dvh">
            <Sidebar stores={stores} />
            <div className="flex min-w-0 flex-1 flex-col">
                <Navbar stores={stores} />
                <main className="flex-1">{children}</main>
            </div>
        </div>
    )
}
