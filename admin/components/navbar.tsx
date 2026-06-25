import React from 'react'
import { Store } from '@prisma/client';
import AccountMenu from '@/components/account-menu';
import MobileNav from '@/components/mobile-nav';
import { Wordmark } from '@/components/main-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import LanguageSwitcher from '@/components/language-switcher';

interface NavbarProps {
  stores: Store[];
}

const Navbar = ({ stores }: NavbarProps) => {
  return (
    <div className='flex h-14 items-center gap-4 border-b px-4'>
      <MobileNav stores={stores} />
      <div className='md:hidden'>
        <Wordmark />
      </div>
      <div className='ml-auto flex items-center space-x-4'>
        <LanguageSwitcher />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </div>
  )
}

export default Navbar
