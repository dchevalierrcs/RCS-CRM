'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  data: ChartData[];
  loading: boolean;
  error: string | null;
  dataKeyLabel: string;
  valueFormatter?: (value: number) => string;
}

export default function BarChartCard({ title, data, loading, error, dataKeyLabel, valueFormatter }: BarChartCardProps) {
  const defaultFormatter = (value: number) => value.toString();
  const formatValue = valueFormatter || defaultFormatter;

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3 className="card-title">
          <BarChartIcon className="h-5 w-5 mr-3 text-gray-600" />
          {title}
        </h3>
      </div>
      <div className="card-body pt-4" style={{ height: '300px' }}>
        {loading && <div className="flex items-center justify-center h-full text-gray-500">Chargement du graphique...</div>}
        {error && <div className="flex items-center justify-center h-full text-red-500">{error}</div>}
        {!loading && !error && data && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatValue} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip formatter={formatValue} cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }} />
              <Legend />
              <Bar dataKey="value" name={dataKeyLabel} fill="#4F46E5" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {!loading && !error && (!data || data.length === 0) && (
            <div className="flex items-center justify-center h-full text-gray-500 italic">Aucune donnée à afficher.</div>
        )}
      </div>
    </div>
  );
}