// frontend/src/components/analytics/AnalyticsTable.tsx
'use client';

import React from 'react';

const AnalyticsTable = ({ data, loading }: any) => {
  if (loading) {
    return <div className="text-center p-8">Chargement des données...</div>;
  }
  if (!data || !data.results || data.results.length === 0) {
    return <div className="text-center p-8 text-gray-500">Aucune donnée à afficher pour cette sélection.</div>;
  }
  
  const formatCurrency = (value: string | number) => {
    const num = parseFloat(value as string) * 12;
    if (isNaN(num)) return '0 €';
    return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Détails par {data.groupBy}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{data.groupBy}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de Clients</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu Annuel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience Totale</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.results.map((row: any, index: number) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.category || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.client_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(row.total_monthly_revenue)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(row.total_audience).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsTable;