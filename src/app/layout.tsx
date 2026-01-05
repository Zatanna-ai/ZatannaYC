import type { Metadata } from 'next'
import { Crimson_Pro } from 'next/font/google'
import './globals.css'

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson-pro',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'YC Batch W26 Report | Zatanna',
  description: 'Comprehensive report on YC Batch W26 founders - interests, backgrounds, education, and more',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={crimsonPro.variable}>
      <body>{children}</body>
    </html>
  )
}

