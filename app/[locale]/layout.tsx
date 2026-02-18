import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
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

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
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
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Prode Mundial';
  const messages = await getMessages();

  return (
    <html lang={locale} style={{ height: '100%' }}>
      <head>
        <meta name="apple-mobile-web-app-title" content={appName}/>
      </head>
      <body style={{minHeight: '100%', paddingBottom: '64px'}}>
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
