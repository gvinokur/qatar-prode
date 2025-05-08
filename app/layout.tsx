'use server'

import SessionWrapper from "./components/session-wrapper";
import '../styles/globals.css'
import ThemeProvider, {ThemeMode} from "./components/context-providers/theme-provider";
import {ThemeProvider as NextThemeProvider} from "next-themes";
import {Metadata} from "next";
import InstallPwa from "./components/Install-pwa";
import OfflineDetection from "./components/offline-detection";
import NotificationsSubscriptionPrompt from "./components/notifications-subscription-prompt";

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
      {rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml'},
      {rel: 'icon', url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png'},
      {rel: 'shortcut icon', url: '/favicon.ico'},
      {rel: 'apple-touch-icon', url: '/apple-touch-icon.png', sizes: '180x180'},
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
              <OfflineDetection />
              <NotificationsSubscriptionPrompt/>
            </ThemeProvider>
          </NextThemeProvider>
        </body>
      </html>
    </SessionWrapper>
  )
}
