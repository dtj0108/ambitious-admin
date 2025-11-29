import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ambitious Social Admin Panel',
  description: 'Admin panel for Ambitious Social',
  openGraph: {
    title: 'Ambitious Social Admin Panel',
    description: 'Admin panel for Ambitious Social',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1500,
        height: 500,
        alt: 'Ambitious Social Admin Panel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ambitious Social Admin Panel',
    description: 'Admin panel for Ambitious Social',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
