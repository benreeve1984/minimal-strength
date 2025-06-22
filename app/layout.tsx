import './globals.css'
import type { Metadata, Viewport } from 'next'

// App metadata for PWA and SEO optimization
export const metadata: Metadata = {
  title: 'Minimal Strength',
  description: 'A minimalist strength training app for tracking pull-ups and dips',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Minimal Strength',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Prevent zoom on input focus (iOS specific) */}
        <meta name="format-detection" content="telephone=no" />
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-background text-text-primary font-sans antialiased overflow-x-hidden">
        {/* Safe area wrapper for iPhone notches and home indicators */}
        <div className="min-h-screen-safe">
          {children}
        </div>
      </body>
    </html>
  )
} 