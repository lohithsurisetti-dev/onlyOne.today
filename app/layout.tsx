import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OnlyOne.today - Discover How Unique You Are',
  description: 'Share what you did today and discover your uniqueness! Join thousands exploring daily actions across city, state, country, and world. Anonymous, fun, and instant.',
  keywords: ['uniqueness', 'daily actions', 'social discovery', 'anonymous', 'trending', 'community', 'authentic', 'rare actions'],
  authors: [{ name: 'OnlyOne.today' }],
  creator: 'OnlyOne.today',
  publisher: 'OnlyOne.today',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://onlyone-today.vercel.app'),
  openGraph: {
    title: 'OnlyOne.today - Discover How Unique You Are',
    description: 'Share what you did today and discover your uniqueness! Anonymous, fun, and instant.',
    url: 'https://onlyone-today.vercel.app',
    siteName: 'OnlyOne.today',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/api/og-image', // Dynamic OG image
        width: 1200,
        height: 630,
        alt: 'OnlyOne.today - Discover Your Uniqueness',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnlyOne.today - Discover How Unique You Are',
    description: 'Share what you did today and discover your uniqueness!',
    images: ['/api/og-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add later: google: 'your-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a0b2e" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}


