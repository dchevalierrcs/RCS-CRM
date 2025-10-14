// frontend/src/components/analytics/AnalyticsKPIs.tsx
'use client';

import React from 'react';
import { Users, DollarSign, BarChart2 } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, loading }: any) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm flex items-center space-x-4">
      <div className="bg-blue-100 p-3 rounded-full">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {loading ? (
          <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
};

const AnalyticsKPIs = ({ data, loading }: any) => {
  const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return '0 €';
    return `${(value * 12).toLocaleString('fr-FR')} €`;
  };
  
  const formatNumber = (value: number) => {
    if (typeof value !== 'number') return '0';
    return value.toLocaleString('fr-FR');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KPICard title="Nombre de Clients" value={formatNumber(data?.totalclients)} icon={Users} loading={loading} />
      <KPICard title="Revenu Annuel Total" value={formatCurrency(data?.totalrevenue)} icon={DollarSign} loading={loading} />
      <KPICard title="Audience Totale" value={formatNumber(data?.totalaudience)} icon={BarChart2} loading={loading} />
    </div>
  );
};

export default AnalyticsKPIs;