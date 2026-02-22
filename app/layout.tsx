import '../styles/globals.css'
import {Metadata} from "next";

export async function generateMetadata() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Prode Mundial';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Plataforma de pronósticos deportivos';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app';

  return {
    title: appName,
    description: appDescription,
    manifest: '/manifest.json',
    metadataBase: new URL(appUrl),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: appName,
    },
    openGraph: {
      type: 'website',
      siteName: appName,
      title: appName,
      description: appDescription,
      url: appUrl,
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
    icons: [
      {rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml'},
      {rel: 'icon', url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png'},
      {rel: 'shortcut icon', url: '/favicon.ico'},
      {rel: 'apple-touch-icon', url: '/apple-touch-icon.png', sizes: '180x180'},
    ]
  } as Metadata;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
