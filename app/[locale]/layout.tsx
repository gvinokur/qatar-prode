import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import SessionWrapper from "../components/session-wrapper";
import ThemeProvider from "../components/context-providers/theme-provider";
import { ThemeVariantProvider } from "../components/context-providers/theme-variant-provider";
import NextThemeProvider from '../components/context-providers/next-theme-wrapper-provider';
import InstallPwa from "../components/Install-pwa";
import OfflineDetection from "../components/offline-detection";
import Header from "../components/header/header";
import ConditionalHeader from "../components/header/conditional-header";
import {getLoggedInUser} from "../actions/user-actions";
import { TimezoneProvider } from '../components/context-providers/timezone-context-provider';
import { CountdownProvider } from '../components/context-providers/countdown-context-provider';
import Footer from '../components/home/footer';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app'

  const appName = t('app.name')
  const appDescription = t('app.description')

  // Determine alternate locale
  const alternateLocale = locale === 'es' ? 'en' : 'es'

  return {
    title: appName,
    description: appDescription,
    manifest: `/${locale}/manifest.webmanifest`,
    metadataBase: new URL(appUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'es': '/es',
        'en': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale,
      alternateLocale: [alternateLocale],
      siteName: appName,
      title: appName,
      description: appDescription,
      url: `${appUrl}/${locale}`,
      images: [
        {
          url: '/web-app-manifest-512x512.png',
          width: 512,
          height: 512,
          alt: appName,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: appName,
      description: appDescription,
      images: ['/web-app-manifest-512x512.png'],
    },
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  readonly children: React.ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getLoggedInUser();
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'common' })

  const appName = t('app.name')

  return (
    <html lang={locale} style={{ height: '100%' }}>
      <head>
        <meta name="apple-mobile-web-app-title" content={appName}/>
      </head>
      <body style={{minHeight: '100%'}}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <TimezoneProvider>
            <CountdownProvider>
              <NextThemeProvider defaultTheme={'system'} enableSystem={true}>
                <ThemeVariantProvider>
                  <ThemeProvider>
                    <SessionWrapper>
                      <ConditionalHeader>
                        <Header user={user}/>
                      </ConditionalHeader>
                      {children}
                      <Footer message={`${appName} © 2025`} />
                      <InstallPwa />
                      <OfflineDetection />
                    </SessionWrapper>
                  </ThemeProvider>
                </ThemeVariantProvider>
              </NextThemeProvider>
            </CountdownProvider>
          </TimezoneProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
