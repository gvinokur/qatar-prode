import { Suspense } from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {Metadata} from 'next';
import Script from 'next/script';
import SessionWrapper from "../components/session-wrapper";
import ThemeProvider from "../components/context-providers/theme-provider";
import NextThemeProvider from '../components/context-providers/next-theme-wrapper-provider';
import InstallPwa from "../components/Install-pwa";
import OfflineDetection from "../components/offline-detection";
import Header from "../components/header/header";
import ConditionalHeader from "../components/header/conditional-header";
import {getLoggedInUser} from "../actions/user-actions";
import { TimezoneProvider } from '../components/context-providers/timezone-context-provider';
import { CountdownProvider } from '../components/context-providers/countdown-context-provider';
import Footer from '../components/home/footer';
import AdSensePageViewTracker from '../components/ads/adsense-page-view-tracker';
import AnalyticsPageViewTracker from '../components/shared-ui/AnalyticsPageViewTracker';

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

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  return {
    title: appName,
    description: appDescription,
    manifest: `/${locale}/manifest.webmanifest`,
    ...(publisherId && {
      other: {
        'google-adsense-account': `ca-${publisherId}`,
      },
    }),
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
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale} style={{ height: '100%' }}>
      <head>
        <meta name="apple-mobile-web-app-title" content={appName}/>
        {/* Google Fonts for theme typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && !user?.isAdFree && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        {gaMeasurementId && !user?.isAdFree && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${gaMeasurementId}', {
                  send_page_view: false
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body style={{minHeight: '100%'}}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <TimezoneProvider>
            <CountdownProvider>
              <NextThemeProvider defaultTheme={'system'} enableSystem={true}>
                <ThemeProvider>
                  <SessionWrapper>
                    <ConditionalHeader>
                      <Header user={user}/>
                    </ConditionalHeader>
                    {children}
                    <Footer message={`${appName} © 2025`} />
                    <InstallPwa />
                    <OfflineDetection />
                    <AdSensePageViewTracker />
                    <Suspense fallback={null}>
                      <AnalyticsPageViewTracker user={user ?? null} />
                    </Suspense>
                  </SessionWrapper>
                </ThemeProvider>
              </NextThemeProvider>
            </CountdownProvider>
          </TimezoneProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}