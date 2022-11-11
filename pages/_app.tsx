import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { initThinBackend } from 'thin-backend';
import { ThinBackend } from 'thin-backend-react';
import 'thin-backend-react/auth.css';
import Layout from '../components/layout'

initThinBackend({ host: process.env.NEXT_PUBLIC_BACKEND_URL });

function MyApp({ Component, pageProps }: AppProps) {
  // @ts-ignore
  return (
    <ThinBackend>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThinBackend>)
}
export default MyApp
