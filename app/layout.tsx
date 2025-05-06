'use server'

import SessionWrapper from "./components/session-wrapper";
import '../styles/globals.css'
import ThemeProvider, {ThemeMode} from "./components/context-providers/theme-provider";
import {ThemeProvider as NextThemeProvider} from "next-themes";
import {Metadata} from "next";
import InstallPwa from "./components/Install-pwa";

export async  function generateMetadata() {
  return {
    title: 'La Maquina',
    description: "Pagina de prode para multiples torneos de futbol",
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'La Maquina',
    },
    icons: [
      {rel: 'apple-touch-icon', url: '/apple-icon.png'},
      {rel: 'shortcut icon', url: '/favicon.ico'}
    ]
  } as Metadata;
}

export async function createViewport() {
  return {
    themeColor: '#242424',
    colorScheme: 'dark light',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  }
}

export default async function RootLayout({
                                     // Layouts must accept a children prop.
                                     // This will be populated with nested layouts or pages
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
    <SessionWrapper>
      <html lang="en" style={{ height: '100%' }} suppressHydrationWarning>
        <head>
          <meta name="apple-mobile-web-app-title" content="La Maquina"/>
        </head>
        <body style={{minHeight: '100%'}}>
          <NextThemeProvider defaultTheme={'light'} enableSystem={false}>
            <ThemeProvider>
              {children}
              <InstallPwa />
              {/*<ServiceWorkerRegistration />*/}
              {/*<OfflineDetection />*/}
            </ThemeProvider>
          </NextThemeProvider>
        </body>
      </html>
    </SessionWrapper>
  )
}
