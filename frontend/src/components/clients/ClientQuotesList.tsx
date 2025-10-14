'use client';

import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';
import { Eye, FileText } from 'lucide-react';

interface Quote {
  id: number;
  quote_number: string;
  subject: string;
  status: 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé';
  emission_date: string;
  total_ttc: string;
  user_nom: string;
}

interface ClientQuotesListProps {
  clientId: number;
}

export default function ClientQuotesList({ clientId }: ClientQuotesListProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!clientId) return;
      try {
        setIsLoading(true);
        const data = await api.get(`/quotes/client/${clientId}`);
        setQuotes(data);
      } catch (err: any) {
        setError("Impossible de charger la liste des devis. " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();
  }, [api, clientId]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const getStatusClass = (status: Quote['status']) => {
    switch (status) {
      case 'Accepté': return 'bg-green-100 text-green-800';
      case 'Envoyé': return 'bg-blue-100 text-blue-800';
      case 'Refusé': return 'bg-red-100 text-red-800';
      case 'Brouillon':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <FileText className="w-6 h-6 mr-3 text-gray-500"/>
          Devis Associés
        </h3>
      </div>
      
      {isLoading && <p className="text-center text-gray-500">Chargement des devis...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3">Numéro</th>
                <th className="p-3">Objet</th>
                <th className="p-3">Date</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Montant TTC</th>
                <th className="p-3">Créé par</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length > 0 ? quotes.map((quote) => (
                <tr key={quote.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-blue-600">{quote.quote_number}</td>
                  <td className="p-3">{quote.subject}</td>
                  <td className="p-3">{formatDate(quote.emission_date)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold">{parseFloat(quote.total_ttc).toFixed(2)} €</td>
                  <td className="p-3 text-gray-600">{quote.user_nom}</td>
                  <td className="p-3 text-center">
                    {/* --- CORRECTION DU LIEN --- */}
                    <Link href={`/quotes/${quote.id}`} className="btn-icon btn-secondary" title="Voir le devis">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500">
                    Aucun devis trouvé pour ce client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
