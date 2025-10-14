'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarClock, ArrowRight } from 'lucide-react';

interface CommercialAction {
  id: number;
  action_type: string;
  follow_up_date: string;
  nom_radio: string;
  client_id: number;
}

interface CommercialSummaryCardProps {
  data: CommercialAction[] | undefined;
  loading: boolean;
}

export default function CommercialSummaryCard({ data, loading }: CommercialSummaryCardProps) {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
    });
  };

  const getActionTypeTranslation = (type: string) => {
    const translations: { [key: string]: string } = {
      'Appel': 'Appel',
      'Email': 'Email',
      'Rendez-vous': 'Rendez-vous',
      'Relance': 'Relance',
      'Autre': 'Autre',
    };
    return translations[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm h-full flex flex-col">
      <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4">
        <CalendarClock className="w-6 h-6 mr-3 text-gray-500" />
        Actions à venir
      </h3>
      
      {data && data.length > 0 ? (
        <ul className="space-y-4 flex-1">
          {data.map((action) => (
            <li key={action.id} className="flex items-center justify-between group">
              <div className="flex items-center">
                <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 font-bold rounded-lg p-2 w-16 h-16 mr-4">
                  <span className="text-2xl">{new Date(action.follow_up_date).getDate()}</span>
                  <span className="text-xs uppercase">{new Date(action.follow_up_date).toLocaleString('fr-FR', { month: 'short' })}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{getActionTypeTranslation(action.action_type)}</p>
                  <Link href={`/clients/${action.client_id}`} className="text-sm text-blue-600 hover:underline">
                    {action.nom_radio}
                  </Link>
                </div>
              </div>
              <Link href={`/clients/${action.client_id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-gray-500">Aucune action commerciale prévue dans les 7 prochains jours.</p>
        </div>
      )}
    </div>
  );
}
