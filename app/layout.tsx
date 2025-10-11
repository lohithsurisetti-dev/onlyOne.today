import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OnlyOne.today - What did you do differently today?',
  description: 'While the world follows the trend, you did something no one else did.',
  keywords: ['uniqueness', 'mindfulness', 'social', 'trends', 'authentic'],
  authors: [{ name: 'OnlyOne.today' }],
  openGraph: {
    title: 'OnlyOne.today',
    description: 'While the world follows the trend, you did something no one else did.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnlyOne.today',
    description: 'What did you do differently today?',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

