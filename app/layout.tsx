import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ambitious Admin',
  description: 'Admin panel for Ambitious Social',
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
