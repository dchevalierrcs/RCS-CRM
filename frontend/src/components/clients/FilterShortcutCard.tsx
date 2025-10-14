// frontend/src/components/clients/FilterShortcutCard.tsx
'use client';

import { LucideIcon, Plus } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  Icon?: LucideIcon;
  imageUrl?: string;
  stats?: string; // Ajout de la prop pour les statistiques
  onClick?: () => void;
  isActive?: boolean;
  isEmpty?: boolean;
}

export default function FilterShortcutCard({
  title,
  description,
  Icon,
  imageUrl,
  stats, // On récupère la nouvelle prop
  onClick,
  isActive = false,
  isEmpty = false,
}: Props) {
  
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center p-4 h-full border-2 border-dashed bg-gray-50 rounded-xl text-gray-400">
        <Plus className="h-5 w-5" />
      </div>
    );
  }

  const activeClasses = 'border-blue-500 bg-blue-50 text-blue-700';
  const inactiveClasses = 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50';

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 h-full border-2 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="h-6 mr-4" />
      ) : Icon && (
        <div className="mr-4">
          <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
        </div>
      )}

      <div>
        <div className="flex items-center space-x-2">
          <p className={`font-bold ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>{title}</p>
          {stats && <span className={`text-sm font-semibold ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>{stats}</span>}
        </div>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}