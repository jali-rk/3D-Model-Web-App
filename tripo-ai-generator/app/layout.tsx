import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tripo AI 3D Generator',
  description: 'Convert images to 3D models using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}