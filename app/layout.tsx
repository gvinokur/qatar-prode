'use server'

import SessionWrapper from "./components/session-wrapper";
import '../styles/globals.css'
import ThemeProvider from "./components/context-providers/theme-provider";
import NextThemeProvider from './components/context-providers/next-theme-wrapper-provider';
import {Metadata} from "next";
import InstallPwa from "./components/Install-pwa";
import OfflineDetection from "./components/offline-detection";
import Header from "./components/header/header";
import ConditionalHeader from "./components/header/conditional-header";
import {getLoggedInUser} from "./actions/user-actions";
import { unstable_ViewTransition as ViewTransition } from 'react'
import { TimezoneProvider } from './components/context-providers/timezone-context-provider';
import { CountdownProvider } from './components/context-providers/countdown-context-provider';
import Footer from './components/home/footer';

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

export default async function RootLayout({
                                     // Layouts must accept a children prop.
                                     // This will be populated with nested layouts or pages
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  const user = await getLoggedInUser();

  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        <meta name="apple-mobile-web-app-title" content="La Maquina"/>
      </head>
      <body style={{minHeight: '100%', paddingBottom: '64px'}}>
        <TimezoneProvider>
          <CountdownProvider>
            <NextThemeProvider defaultTheme={'system'} enableSystem={true}>
              <ThemeProvider>
                <SessionWrapper>
                  <ConditionalHeader>
                    <Header user={user}/>
                  </ConditionalHeader>
                  <ViewTransition
                    name={'main'}
                    enter={'page-enter'}
                    exit={'page-exit duration-100'}
                  >
                    {children}
                  </ViewTransition>
                  <Footer message="La Maquina © 2025" />
                  <InstallPwa />
                  <OfflineDetection />
                </SessionWrapper>
              </ThemeProvider>
            </NextThemeProvider>
          </CountdownProvider>
        </TimezoneProvider>
      </body>
    </html>
  )
}
