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

// Get site URL from environment or fallback
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://onlyonetoday.com'

export const metadata: Metadata = {
  title: 'OnlyOne Today - Discover How Unique You Are',
  description: 'Share what you did today and discover your uniqueness! Join thousands exploring daily actions across city, state, country, and world. Anonymous, fun, and instant.',
  keywords: ['uniqueness', 'daily actions', 'social discovery', 'anonymous', 'trending', 'community', 'authentic', 'rare actions'],
  authors: [{ name: 'OnlyOne Today' }],
  creator: 'OnlyOne Today',
  publisher: 'OnlyOne Today',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'OnlyOne Today - Discover How Unique You Are',
    description: 'Share what you did today and discover your uniqueness! Anonymous, fun, and instant.',
    url: SITE_URL,
    siteName: 'OnlyOne Today',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/api/og-image', // Dynamic OG image
        width: 1200,
        height: 630,
        alt: 'OnlyOne.Today - Discover Your Uniqueness',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnlyOne Today - Discover How Unique You Are',
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


