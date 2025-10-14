'use client';

import { useMemo } from 'react';
import { TrendingUp, Trophy, TrendingDown } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { Audience } from '@/types';

interface Props {
  audiences: Audience[];
}

export default function DerniereAudienceCard({ audiences }: Props) {
    
  const processedData = useMemo(() => {
    if (!audiences || audiences.length === 0) {
      return null;
    }
    
    const primaryType = audiences[0]?.type_nom;
    const filteredAudiences = audiences
      .filter(a => a.type_nom === primaryType)
      .sort((a,b) => (a.annee || 0) - (b.annee || 0) || (a.vague || '').localeCompare(b.vague || ''));

    if (filteredAudiences.length === 0) return null;

    const latest = filteredAudiences[filteredAudiences.length - 1];
    const previous = filteredAudiences.length > 1 ? filteredAudiences[filteredAudiences.length - 2] : null;

    const evolution = (previous && previous.audience > 0) 
      ? ((latest.audience - previous.audience) / previous.audience) * 100 
      : null;

    const record = filteredAudiences.reduce((max, aud) => aud.audience > max.audience ? aud : max, filteredAudiences[0]);
    const minimum = filteredAudiences.reduce((min, aud) => aud.audience < min.audience ? aud : min, filteredAudiences[0]);

    const chartData = filteredAudiences.slice(-12).map(aud => ({ name: aud.vague, audience: aud.audience }));

    return { latest, evolution, record, minimum, chartData };
  }, [audiences]);

  if (!processedData) {
    return (
      <div className="dashboard-card p-4">
        <h3 className="card-title font-bold text-lg flex items-center mb-4"><TrendingUp className="h-5 w-5 mr-2" />Audience</h3>
        <p className="text-sm text-gray-500">Aucune donnée d'audience disponible.</p>
      </div>
    );
  }

  const { latest, evolution, record, minimum, chartData } = processedData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded-md shadow-lg text-sm">
          <p className="font-bold">{`${payload[0].payload.name}`}</p>
          <p>{`Audience: ${payload[0].value.toLocaleString('fr-FR')}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card p-4">
      <h3 className="card-title font-bold text-lg flex items-center mb-4"><TrendingUp className="h-5 w-5 mr-2" />Audience</h3>
      <div className="text-center">
        
        {/* Indicateur de tendance (Hausse/Baisse) ajouté à côté du chiffre */}
        <div className="flex items-center justify-center gap-2">
          {evolution !== null && (
            evolution >= 0 ? (
              <TrendingUp className="h-10 w-10 text-green-500" />
            ) : (
              <TrendingDown className="h-10 w-10 text-red-500" />
            )
          )}
          <p className="text-4xl font-bold text-gray-800">{latest.audience.toLocaleString('fr-FR')}</p>
        </div>
        
        <p className="text-sm text-gray-500">auditeurs</p>
        {evolution !== null && (
          <span className={`badge ${evolution >= 0 ? 'badge-green' : 'badge-red'}`}>
            {evolution >= 0 ? '▲' : '▼'} {Math.abs(evolution).toFixed(1)}% ({latest.vague || 'N/A'})
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 my-2">Historique ({chartData.length} mesures)</div>
      <div style={{ width: '100%', height: 100 }} className="mb-4">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="audience" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between gap-2 text-xs">
        <div className="bg-blue-50 text-blue-800 p-2 rounded-md text-center flex-1">
          <p className="font-bold flex items-center justify-center gap-1.5">
            <Trophy className="h-4 w-4" />
            RECORD
          </p>
          <p className="text-lg font-semibold">{record.audience.toLocaleString('fr-FR')}</p>
          <p className="opacity-70">{record.vague || 'N/A'}</p>
        </div>
        <div className="bg-orange-50 text-orange-800 p-2 rounded-md text-center flex-1">
          <p className="font-bold flex items-center justify-center gap-1.5">
            <TrendingDown className="h-4 w-4" />
            MINIMUM
          </p>
          <p className="text-lg font-semibold">{minimum.audience.toLocaleString('fr-FR')}</p>
          <p className="opacity-70">{minimum.vague || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}