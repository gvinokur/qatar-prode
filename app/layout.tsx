'use server'

import SessionWrapper from "./components/session-wrapper";
import '../styles/globals.css'
import ThemeProvider, {ThemeMode} from "./components/context-providers/theme-provider";
import {ThemeProvider as NextThemeProvider} from "next-themes";

// export const metadata: Metadata = {
//   title: 'Prode App',
//   description: 'Prode Mundial, Copa America, Eurocopa y otros.',
// };

export default async function RootLayout({
                                     // Layouts must accept a children prop.
                                     // This will be populated with nested layouts or pages
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
    <SessionWrapper>
      <html lang="en" style={{ height: '100%' }}>
        <body style={{ minHeight: '100%' }}>
          <NextThemeProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </NextThemeProvider>
        </body>
      </html>
    </SessionWrapper>
  )
}
