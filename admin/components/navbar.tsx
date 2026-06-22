import React from 'react'
import { getUserId } from '@/lib/server-auth'
import AccountMenu from '@/components/account-menu';
import { MainNav } from '@/components/main-nav';
import StoreSwitcher from '@/components/store-switcher';
import { redirect } from 'next/navigation'
import prismadb from '@/lib/prismadb';
import { ThemeToggle } from '@/components/theme-toggle';
import LanguageSwitcher from '@/components/language-switcher';

const Navbar = async () => {
  const userId = await getUserId();

  if(!userId) {
    redirect("/sign-in")
  }

  const stores = await prismadb?.store.findMany({
    where: {
      userId,
    }
  })

  return (
    <div className='border-b'>
        <div className='flex items-center h-16 px-4'>
            <StoreSwitcher items={stores} />
            <MainNav className='mx-6' />
            <div className='flex items-center ml-auto space-x-4'>
              <LanguageSwitcher />
              <ThemeToggle />
                <AccountMenu />
            </div>
        </div>
    </div>
  )
}

export default Navbar
