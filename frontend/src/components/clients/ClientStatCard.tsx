// frontend/src/components/clients/ClientStatCard.tsx
'use client';

import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: number;
  Icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple'; // Ajout de la couleur
  isActive: boolean;
  onClick: () => void;
}

export default function ClientStatCard({ title, value, Icon, color, isActive, onClick }: Props) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' }, // Ajout des classes pour le violet
  };

  const selectedColor = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`dashboard-card cursor-pointer border-2 transition-all duration-200 ${
        isActive ? selectedColor.border : 'border-transparent'
      } hover:border-gray-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${isActive ? selectedColor.text : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`p-3 ${selectedColor.bg} rounded-xl`}>
          <Icon className={`h-6 w-6 ${selectedColor.text}`} />
        </div>
      </div>
    </div>
  );
}