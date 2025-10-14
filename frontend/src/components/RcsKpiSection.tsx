// components/RcsKpiSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Radio, Calendar, Layers, Globe } from 'lucide-react';
import PercentageCircle from './PercentageCircle';

interface KpiData {
  programmation: number;
  diffusion: number;
  planification: number;
  streaming: number;
}

interface SoftwareUsage {
  type: 'programmation' | 'diffusion' | 'planification' | 'streaming';
  name: string;
  count: number;
}

const softwareIcons = {
  programmation: Calendar,
  diffusion: Radio,
  planification: Layers,
  streaming: Globe,
};

export default function RcsKpiSection() {
  const [data, setData] = useState<{ kpis: KpiData; softwareUsage: SoftwareUsage[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/analytics/rcs-kpis');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Erreur lors de la récupération des données');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des KPIs RCS...</p>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-card text-center p-8 text-red-600">Erreur: {error}</div>;
  }

  return (
    <div className="dashboard-card p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Indés Radios : Part de Marché Audience RCS</h2>
      
      {/* Section des KPIs en cercles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <PercentageCircle percentage={data?.kpis.programmation || 0} label="Programmation" />
        <PercentageCircle percentage={data?.kpis.diffusion || 0} label="Diffusion" />
        <PercentageCircle percentage={data?.kpis.planification || 0} label="Planification" />
        <PercentageCircle percentage={data?.kpis.streaming || 0} label="Streaming" />
      </div>

      <hr className="my-6" />

      {/* Section du décompte par logiciel */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition des logiciels au sein du groupement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.keys(softwareIcons).map(type => {
            const Icon = softwareIcons[type as keyof typeof softwareIcons];
            const softwareList = data?.softwareUsage.filter(s => s.type === type) || [];
            return (
              <div key={type} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <h4 className="font-bold capitalize text-gray-700">{type}</h4>
                </div>
                <ul className="space-y-2">
                  {softwareList.length > 0 ? softwareList.map(software => (
                    <li key={software.name} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-800">{software.name}</span>
                      <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                        {software.count}
                      </span>
                    </li>
                  )) : (
                    <p className="text-sm text-gray-500 italic">Aucun</p>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}