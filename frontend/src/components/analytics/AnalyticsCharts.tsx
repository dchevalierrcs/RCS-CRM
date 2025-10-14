// frontend/src/components/analytics/AnalyticsCharts.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useApi } from '@/hooks/useApi'; // ON IMPORTE L'ASSISTANT ICI AUSSI

const AnalyticsCharts = ({ filters, search }: any) => {
  const [distributionData, setDistributionData] = useState([]);
  const [topData, setTopData] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi(); // On initialise l'assistant

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        ...(search.type === 'radio' && search.id && { clientId: search.id }),
        ...(search.type === 'groupe' && search.id && { nom_groupe: search.id }),
      }).toString();

      try {
        const [distData, topData] = await Promise.all([
          api.get(`/analytics/distribution?dimension=editeur&${params}`),
          api.get(`/analytics/top?dimension=logiciel&${params}`)
        ]);
        setDistributionData(distData);
        setTopData(topData);
      } catch (error) {
        console.error("Erreur chargement des données graphiques:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, filters, search]);

  if (loading) return <div>Chargement des graphiques...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Répartition par Éditeur (Services)</h3>
        {distributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {distributionData.map((entry: any, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toLocaleString('fr-FR')} €`} />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-500">Aucune donnée</p>}
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Top 5 Logiciels (par utilisation)</h3>
        {topData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
        </ResponsiveContainer>
        ) : <p className="text-sm text-gray-500">Aucune donnée</p>}
      </div>
    </div>
  );
};

export default AnalyticsCharts;