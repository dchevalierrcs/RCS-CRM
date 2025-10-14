// frontend/src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings,
  UserCog,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Devis', href: '/quotes', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const adminNavigation = [
    { name: 'Users', href: '/users', icon: UserCog },
    { name: 'Paramètres', href: '/parametres', icon: Settings },
];

const settingsSubNavigation = [
    { name: 'Grilles Tarifaires', href: '/parametres/grilles-tarifaires' },
    { name: 'Catalogue & Références', href: '/parametres/references' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isSettingsActive = pathname.startsWith('/parametres');

  return (
    <div className="w-72 h-screen bg-white shadow-lg border-r border-gray-200 flex flex-col">
      
      <div className="p-6 border-b border-gray-200 flex flex-col items-center text-center space-y-2">
        <a href="/">
          <img 
            src="http://localhost:5000/uploads/logos/RCS.png" 
            alt="Logo RCS" 
            className="w-48 h-auto"
          />
        </a>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !item.href.startsWith('/parametres'));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
        
        {user && user.role === 'admin' && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <span className="px-4 text-xs font-semibold text-gray-400 uppercase">Administration</span>
            </div>
            
            {adminNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                    <div key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="h-5 w-5 mr-3" />
                          {item.name}
                        </Link>
                        {item.name === 'Paramètres' && isSettingsActive && (
                            <ul className="pl-10 mt-1 space-y-1">
                                {settingsSubNavigation.map(subItem => (
                                    <li key={subItem.name}>
                                        <Link href={subItem.href}
                                            className={`block px-4 py-2 text-xs rounded-md ${
                                                pathname === subItem.href
                                                ? 'font-semibold text-blue-600'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                        >
                                            {subItem.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
          </>
        )}
      </nav>
    </div>
  );
}

