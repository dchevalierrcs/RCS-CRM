// src/app/layout.tsx

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { AuthProvider } from '@/contexts/AuthProvider' // <-- AJOUT DE L'IMPORT

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RCS Clients - Dashboard',
  description: 'Plateforme CRM pour la gestion des clients RCS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider> {/* <-- ON ENVELOPPE ICI */}
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider> {/* <-- ON FERME L'ENVELOPPE */}
      </body>
    </html>
  )
}