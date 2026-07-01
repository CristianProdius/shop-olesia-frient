import { Footer, Navbar } from '@/components'
import { AssistantLauncher } from '@/components/assistant'
import CartDrawer from '@/components/cart-drawer'
import '../globals.css'
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ModalProvider from '@/providers/modal-provider'
import ToastProvider from '@/providers/toast-provider'
import { routing } from '@/i18n/routing'
import { SITE_URL, alternates } from '@/lib/seo'
import JsonLd from '@/components/json-ld'

// Cyrillic subset is required so Russian product content renders in Montserrat.
const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

// The store renders live data from the admin API on every request.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  const title = t('title')
  const description = t('description')
  const canonical = `${SITE_URL}/${locale}`
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s | LILETTI',
    },
    description,
    alternates: alternates(locale, ''),
    openGraph: {
      type: 'website',
      siteName: 'LILETTI',
      locale,
      url: canonical,
      title,
      description,
      images: [{ url: '/og-default.jpg' }],
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
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

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'LILETTI',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
    },
    sameAs: [
      'https://www.instagram.com/liletti',
      'https://www.tiktok.com/@liletti',
    ],
  }

  const webSiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'LILETTI',
    url: SITE_URL,
    inLanguage: ['en', 'ru', 'ro'],
    publisher: { '@id': `${SITE_URL}/#organization` },
  }

  return (
    <html lang={locale}>
      <body className={`${montserrat.variable} font-sans flex min-h-dvh flex-col`}>
        <JsonLd data={[organizationLd, webSiteLd]} />
        <NextIntlClientProvider>
          <ModalProvider />
          <ToastProvider />
          <CartDrawer />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AssistantLauncher />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
