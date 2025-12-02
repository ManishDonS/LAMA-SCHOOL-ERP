import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '@/context/languageContext'
import { ThemeProvider } from '@/context/themeContext'
import '../styles/globals.css'
import { useEffect } from 'react' // Import useEffect
import { loadWelcomeBannerModule } from '../modules/welcome_banner' // Import the module loader

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Load all modules here
    loadWelcomeBannerModule();
  }, []); // Run once on mount

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          <meta name="theme-color" content="#ffffff" />
          <title>LAMA SCHOOL ERP</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </LanguageProvider>
    </ThemeProvider>
  )
}
