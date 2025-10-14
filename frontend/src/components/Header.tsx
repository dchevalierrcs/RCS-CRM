'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

export function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fonction pour déclencher la recherche
  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/clients?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Gère l'appui sur la touche "Entrée"
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Effet pour fermer le menu déroulant si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);
  
  // Fonction pour obtenir la première lettre du nom pour l'avatar
  const getInitials = (name: string | undefined) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Bienvenue dans votre espace RCS Clients</p>
        </div>

        <div className="flex items-center space-x-6">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un client..."
              className="pl-10 pr-4 py-2.5 w-80 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/parametres" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5" />
            </Link>
          </div>

          <div className="h-8 w-px bg-gray-200"></div>

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-lg">{getInitials(user?.nom)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 text-left">{user?.nom || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500 text-left capitalize">{user?.role || 'Rôle inconnu'}</p>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 animate-fade-in">
                <Link
                  href="/account"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-2" />
                  Mon Compte
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}