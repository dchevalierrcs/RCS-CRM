// src/components/LayoutWrapper.tsx
'use client';

import React, { useEffect } from 'react'; // <-- Changement : import de useEffect
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthProvider';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const hideLayoutRoutes = ['/login', '/register', '/404', '/500'];
  const shouldHideLayout = hideLayoutRoutes.includes(pathname);

  // --- MODIFICATION PRINCIPALE ---
  // Le useEffect est maintenant appelé sans condition au plus haut niveau.
  useEffect(() => {
    // La condition de redirection est maintenant À L'INTÉRIEUR de l'effet.
    if (!isLoading && !isAuthenticated && !shouldHideLayout) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, shouldHideLayout, router]);
  // --- FIN DE LA MODIFICATION ---

  if (shouldHideLayout) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  // Si on charge ou si l'utilisateur n'est pas authentifié (et sera redirigé), on affiche un loader.
  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Chargement de la session...</div>;
  }

  // Si tout est bon, on affiche le layout normal.
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col max-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}