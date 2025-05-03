'use server'

import SessionWrapper from "./components/session-wrapper";
import type {Metadata} from "next";
import '../styles/globals.css'
import BaseLayout from "./components/base-layout";
import ThemeProvider from "./components/context-providers/theme-provider";
import {getServerSession} from "next-auth/next";
import {findUserByEmail} from "./db/users-repository";

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
      <html lang="en">
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </SessionWrapper>
  )
}
