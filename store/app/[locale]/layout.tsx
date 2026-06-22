import { Footer, Navbar } from '@/components'
import '../globals.css'
import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import ModalProvider from '@/providers/modal-provider'
import ToastProvider from '@/providers/toast-provider'
import { routing } from '@/i18n/routing'

// Urbanist has no Cyrillic subset; Russian falls back to the system sans-serif.
const urban = Urbanist({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'Store',
  description: 'Store',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body className={urban.className}>
        <NextIntlClientProvider>
          <ModalProvider />
          <ToastProvider />
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
