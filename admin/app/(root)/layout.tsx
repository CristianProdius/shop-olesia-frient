import { getUserId } from '@/lib/server-auth'
import { redirect } from "next/navigation"
import prismadb from "@/lib/prismadb";

interface DashboardType {
    children: React.ReactNode;
}

export default async function SetupLayout({children}: DashboardType) {
    const userId = await getUserId();

    if (!userId) {
        redirect('/sign-in')
    }

    const store = await prismadb?.store?.findFirst({
        where: {
            userId
        }
    })

    if (store) {
        redirect(`/${store.id}`);
    }

    return (
        <>
            {children}
        </>
    )
}