'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

// L'interface originale pour le graphique camembert
interface ChartData {
  name: string;
  value: number;
  color?: string; 
}

interface PieChartCardProps {
  title: string;
  data: ChartData[];
  loading: boolean;
  error: string | null;
}

const currencyFormatter = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export default function PieChartCard({ title, data, loading, error }: PieChartCardProps) {
  const defaultColor = '#8884d8';

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3 className="card-title">
          <PieChartIcon className="h-5 w-5 mr-3 text-gray-600" />
          {title}
        </h3>
      </div>
      <div className="card-body pt-4" style={{ height: '300px' }}>
        {loading && <div className="flex items-center justify-center h-full text-gray-500">Chargement du graphique...</div>}
        {error && <div className="flex items-center justify-center h-full text-red-500">{error}</div>}
        {!loading && !error && data && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill={defaultColor}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || defaultColor} />
                ))}
              </Pie>
              <Tooltip formatter={currencyFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
        {!loading && !error && (!data || data.length === 0) && (
            <div className="flex items-center justify-center h-full text-gray-500 italic">Aucune donnée à afficher.</div>
        )}
      </div>
    </div>
  );
}