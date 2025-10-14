'use client';

import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

// --- MISE À JOUR DE L'INTERFACE ---
interface OngoingQuote {
  id: number;
  quote_number: string;
  subject: string;
  emission_date: string;
  total_ttc: string;
  client_id: number;
  client_nom: string;
}

interface OngoingQuotesCardProps {
  data: OngoingQuote[] | undefined;
  loading: boolean;
}

export default function OngoingQuotesCard({ data, loading }: OngoingQuotesCardProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(parseFloat(amount));
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
        <FileText className="w-6 h-6 mr-3 text-gray-500" />
        Devis en cours
      </h3>
      
      {data && data.length > 0 ? (
        <ul className="space-y-3 flex-1">
          {data.map((quote) => (
            <li key={quote.id}>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div>
                  <Link href={`/quotes/${quote.id}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                    <span className="font-mono text-sm text-blue-700">{quote.quote_number}</span>: {quote.subject}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    Pour: <Link href={`/clients/${quote.client_id}`} className="text-blue-600 hover:underline">{quote.client_nom}</Link>
                    <span className="mx-2">|</span>
                    <span className="text-xs">{formatDate(quote.emission_date)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-700">{formatCurrency(quote.total_ttc)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-gray-500">Aucun devis en attente.</p>
        </div>
      )}
    </div>
  );
}

