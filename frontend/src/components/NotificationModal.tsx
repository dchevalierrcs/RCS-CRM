// src/components/NotificationModal.tsx
'use client';

import { X, Info, AlertTriangle } from 'lucide-react';

interface Props {
  type: 'info' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
}

export default function NotificationModal({ type, title, message, onClose }: Props) {
  const Icon = type === 'warning' ? AlertTriangle : Info;
  const colorClasses = type === 'warning' 
    ? { border: 'border-yellow-500', icon: 'text-yellow-500', button: 'bg-yellow-500 hover:bg-yellow-600' }
    : { border: 'border-blue-500', icon: 'text-blue-500', button: 'bg-blue-500 hover:bg-blue-600' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-sm m-4 border-t-4 ${colorClasses.border} animate-fade-in-up`}>
        <div className="flex items-start p-6">
          <div className={`mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100`}>
            <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-white text-sm font-semibold rounded-lg shadow-sm ${colorClasses.button} transition-colors`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}