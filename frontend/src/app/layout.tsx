import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TerminZauber - Freie Termine. Sofort gefunden.',
  description: 'Finde kurzfristig verfügbare Physiotherapie-Termine in deiner Nähe',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
