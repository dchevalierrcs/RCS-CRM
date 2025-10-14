'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Printer, Send, CheckCircle, XCircle, Edit, FileText, ArrowLeft, AlertTriangle } from 'lucide-react';

// --- Types de données ---
interface QuoteItem {
  id: number;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_price_ht: string;
  line_discount_percentage: string;
  total_ht_after_discount: string;
}

interface QuoteSection {
  id: number;
  title: string;
  items: QuoteItem[];
}

interface QuoteDetails {
  id: number;
  quote_number: string;
  subject: string;
  status: 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé';
  emission_date: string;
  validity_date: string;
  total_ht_before_discount: string;
  global_discount_percentage: string;
  total_ht_after_discount: string;
  total_tva: string;
  total_ttc: string;
  sections: QuoteSection[];
  client_nom: string; 
  user_nom: string;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const quoteId = params.quoteId as string;
  const api = useApi();

  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchQuoteDetails = async () => {
    if (!quoteId) return;
    try {
      setIsLoading(true);
      const data = await api.get(`/quotes/${quoteId}`);
      setQuote(data);
    } catch (err: any) {
      setError("Impossible de charger le devis. " + (err.message || 'Erreur inconnue'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteDetails();
  }, [api, quoteId]);

  const handleStatusChange = async (newStatus: 'Envoyé' | 'Accepté' | 'Refusé') => {
    if (!quote) return;
    try {
      setNotification(null);
      const updatedQuote = await api.put(`/quotes/${quote.id}/status`, { status: newStatus });
      setQuote(updatedQuote);
      setNotification({ message: `Devis marqué comme ${newStatus.toLowerCase()}.`, type: 'success' });
    } catch (err: any) {
      setNotification({ message: "Échec de la mise à jour du statut. " + (err.message || 'Erreur inconnue'), type: 'error' });
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!quote) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/${quote.id}/pdf`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quote.quote_number}_${quote.client_nom.replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      setNotification({ message: "Échec du téléchargement du PDF: " + err.message, type: 'error' });
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR');
  const formatCurrency = (amount: string) => `${parseFloat(amount).toFixed(2).replace('.', ',')} €`;

  const getStatusInfo = (status: QuoteDetails['status']) => {
    switch (status) {
      case 'Accepté': return { class: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-5 h-5 mr-2" /> };
      case 'Envoyé': return { class: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Send className="w-5 h-5 mr-2" /> };
      case 'Refusé': return { class: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-5 h-5 mr-2" /> };
      case 'Brouillon': default: return { class: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Edit className="w-5 h-5 mr-2" /> };
    }
  };

  if (isLoading) return <div className="p-8 text-center">Chargement du devis...</div>;
  if (error) return <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>;
  if (!quote) return <div className="p-8 text-center">Devis non trouvé.</div>;
  
  const statusInfo = getStatusInfo(quote.status);
  const globalDiscountAmount = parseFloat(quote.total_ht_before_discount) * (parseFloat(quote.global_discount_percentage) / 100);
  const isViewer = user?.role === 'viewer';

  const renderActionButtons = () => {
    if (isViewer) return null;

    switch (quote.status) {
      case 'Brouillon':
        return (
          <button onClick={() => handleStatusChange('Envoyé')} className="btn-modern btn-primary">
            <Send className="w-4 h-4 mr-2"/>
            Marquer comme envoyé
          </button>
        );
      case 'Envoyé':
        return (
          <>
            <button onClick={() => handleStatusChange('Accepté')} className="btn-modern btn-success">
              <CheckCircle className="w-4 h-4 mr-2"/>
              Marquer comme accepté
            </button>
            <button onClick={() => handleStatusChange('Refusé')} className="btn-modern btn-danger">
              <XCircle className="w-4 h-4 mr-2"/>
              Marquer comme refusé
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">

        {notification && (
          <div className={`mb-4 p-4 rounded-lg flex items-center ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <AlertTriangle className="w-5 h-5 mr-3" />
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-auto font-bold">X</button>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
           <button onClick={() => router.back()} className="btn-modern btn-secondary flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2"/>
            Retour
          </button>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="btn-modern btn-secondary">
              <Printer className="w-4 h-4 mr-2"/>
              Imprimer / PDF
            </button>
            {renderActionButtons()}
          </div>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-8 sm:p-12">
          <header className="flex justify-between items-start border-b pb-8 mb-8">
            <div>
              <FileText className="w-12 h-12 text-blue-600 mb-2" />
              <h1 className="text-3xl font-bold text-gray-800">DEVIS</h1>
              <p className="text-gray-500 font-mono">{quote.quote_number}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">RCS Europe</h2>
              <p className="text-sm text-gray-600">Votre Adresse Complète</p>
              <p className="text-sm text-gray-600">75000 Paris, France</p>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Destinataire</h3>
              <p className="font-bold text-lg">{quote.client_nom}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Date d'émission :</span>
                <span>{formatDate(quote.emission_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Date de validité :</span>
                <span>{formatDate(quote.validity_date)}</span>
              </div>
               <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-gray-600">Statut :</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full flex items-center ${statusInfo.class} border`}>
                  {statusInfo.icon}
                  {quote.status}
                </span>
              </div>
            </div>
          </section>

          <section className="mb-10">
             <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Objet</h3>
             <p className="text-lg">{quote.subject}</p>
          </section>

          <section className="space-y-6">
            {quote.sections.map(section => (
              <div key={section.id}>
                <h4 className="font-bold text-lg bg-gray-50 p-3 rounded-t-lg">{section.title}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-3 text-left font-semibold text-gray-600 w-1/2">Description</th>
                        <th className="p-3 text-center font-semibold text-gray-600">Qté</th>
                        <th className="p-3 text-right font-semibold text-gray-600">P.U. HT</th>
                        <th className="p-3 text-right font-semibold text-gray-600">Remise</th>
                        <th className="p-3 text-right font-semibold text-gray-600">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {section.items.map(item => (
                        <tr key={item.id}>
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-center">{item.quantity} {item.unit_of_measure}</td>
                          <td className="p-3 text-right">{formatCurrency(item.unit_price_ht)}</td>
                          <td className="p-3 text-right">{parseFloat(item.line_discount_percentage)}%</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(item.total_ht_after_discount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-10 flex justify-end">
            <div className="w-full sm:w-2/3 md:w-1/2 lg:w-2/5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT brut</span>
                <span>{formatCurrency(quote.total_ht_before_discount)}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-gray-600">Remise globale ({parseFloat(quote.global_discount_percentage)}%)</span>
                <span className="text-red-600">- {formatCurrency(globalDiscountAmount.toString())}</span>
              </div>
              <hr />
               <div className="flex justify-between font-bold">
                <span className="text-gray-800">Total HT net</span>
                <span>{formatCurrency(quote.total_ht_after_discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA (20%)</span>
                <span>{formatCurrency(quote.total_tva)}</span>
              </div>
               <div className="flex justify-between font-bold text-xl bg-gray-100 p-3 rounded-lg">
                <span className="text-gray-900">TOTAL TTC</span>
                <span className="text-blue-600">{formatCurrency(quote.total_ttc)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
