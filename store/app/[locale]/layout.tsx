import { Footer, Navbar } from '@/components'
import '../globals.css'
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ModalProvider from '@/providers/modal-provider'
import ToastProvider from '@/providers/toast-provider'
import { routing } from '@/i18n/routing'
import { buildAlternates, organizationJsonLd } from '@/lib/seo'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liletti.md'

// Montserrat includes the Cyrillic subset required for RU product content.
const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-montserrat',
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    metadataBase: new URL(BASE),
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates(BASE, locale, '/'),
  }
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
      <body className={`${montserrat.variable} ${montserrat.className}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd(BASE)),
          }}
        />
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
