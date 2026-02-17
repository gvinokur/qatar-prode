import '../styles/globals.css'
import {Metadata} from "next";

export async function generateMetadata() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Prode Mundial';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Plataforma de pronósticos deportivos';

  return {
    title: appName,
    description: appDescription,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: appName,
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
