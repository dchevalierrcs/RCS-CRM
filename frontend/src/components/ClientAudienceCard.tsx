'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Edit, Trash2, TrendingUp, BarChart, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { Audience } from '@/types';

interface Props {
  audiences: Audience[];
  onAdd: () => void;
  onEdit: (audience: Audience) => void;
  onDelete: (audienceId: number) => void;
}

// Formatter pour les grands nombres sur l'axe Y du graphique
const DataFormatter = (number: number) => {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toString() + 'K';
  }
  return number.toString();
};

export default function ClientAudienceCard({ audiences, onAdd, onEdit, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const groupedAudiences = useMemo(() => {
    return audiences.reduce((acc, audience) => {
      const key = audience.type_nom || 'Non classé';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(audience);
      // Trier chaque groupe par année puis par nom de vague
      acc[key].sort((a, b) => {
        if ((a.annee || 0) < (b.annee || 0)) return -1;
        if ((a.annee || 0) > (b.annee || 0)) return 1;
        return (a.vague || '').localeCompare(b.vague || '');
      });
      return acc;
    }, {} as Record<string, Audience[]>);
  }, [audiences]);

  useEffect(() => {
    const types = Object.keys(groupedAudiences);
    if (types.length > 0 && (!activeTab || !groupedAudiences[activeTab])) {
      setActiveTab(types[0]);
    }
  }, [groupedAudiences, activeTab]);

  const kpiData = useMemo(() => {
    if (!activeTab || !groupedAudiences[activeTab] || groupedAudiences[activeTab].length === 0) {
      return { record: null, evolution: null };
    }
    const activeAudiences = groupedAudiences[activeTab];
    
    const record = activeAudiences.reduce((max, aud) => aud.audience > max.audience ? aud : max, activeAudiences[0]);
    
    let evolution = null;
    if (activeAudiences.length > 1) {
      const latest = activeAudiences[activeAudiences.length - 1];
      const previous = activeAudiences[activeAudiences.length - 2];
      evolution = latest.audience - previous.audience;
    }
    
    return { record, evolution };
  }, [activeTab, groupedAudiences]);

  const chartData = useMemo(() => {
    if (!activeTab || !groupedAudiences[activeTab]) return [];
    return groupedAudiences[activeTab].slice(-12).map(aud => ({
      name: aud.vague,
      audience: aud.audience,
    }));
  }, [activeTab, groupedAudiences]);

  if (audiences.length === 0) {
     return (
        <div className="dashboard-card">
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title font-bold text-xl flex items-center"><TrendingUp className="h-5 w-5 mr-3 text-green-600" />Audiences</h3>
            <button type="button" onClick={onAdd} className="btn-modern btn-primary text-sm"><Plus className="h-4 w-4 mr-1" />Ajouter une audience</button>
          </div>
          <div className="text-center py-10 bg-gray-50 rounded-lg mt-4">
            <BarChart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucune audience enregistrée pour ce client.</p>
          </div>
        </div>
     );
  }

  return (
    <div className="dashboard-card">
      <div className="card-header flex justify-between items-center">
        <h3 className="card-title font-bold text-xl flex items-center"><TrendingUp className="h-5 w-5 mr-3 text-green-600" />Audiences</h3>
        <button type="button" onClick={onAdd} className="btn-modern btn-primary text-sm"><Plus className="h-4 w-4 mr-1" />Ajouter une audience</button>
      </div>
      
      <div className="border-b border-gray-200 mt-4">
        <nav className="-mb-px flex gap-4" style={{ overflowX: 'auto' }}>
          {Object.keys(groupedAudiences).map(type => (
            <button key={type} onClick={() => setActiveTab(type)}
              className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium ${activeTab === type ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >{type}</button>
          ))}
        </nav>
      </div>

      {activeTab && groupedAudiences[activeTab] && (
        <div className="card-body mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Colonne de Gauche : KPIs & Graphique */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kpiData.record && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Trophy className="h-6 w-6 text-yellow-500 mr-3"/>
                      <div>
                        <p className="text-sm text-gray-500">Record d'audience</p>
                        <p className="text-xl font-bold text-gray-800">{kpiData.record.audience.toLocaleString('fr-FR')}</p>
                        <p className="text-xs text-gray-400">sur la vague {kpiData.record.vague}</p>
                      </div>
                    </div>
                  </div>
                )}
                {kpiData.evolution !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      {kpiData.evolution >= 0 ? <ArrowUp className="h-6 w-6 text-green-500 mr-3"/> : <ArrowDown className="h-6 w-6 text-red-500 mr-3"/>}
                      <div>
                        <p className="text-sm text-gray-500">Évolution vs Vague N-1</p>
                        <p className={`text-xl font-bold ${kpiData.evolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {kpiData.evolution >= 0 ? '+' : ''}{kpiData.evolution.toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={DataFormatter} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [value.toLocaleString('fr-FR'), 'Audience']} />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Line type="monotone" dataKey="audience" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Colonne de Droite : Tableau des données */}
            <div className="lg:col-span-2">
              <div className="overflow-x-auto h-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vague</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Audience</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedAudiences[activeTab].map(aud => (
                      <tr key={aud.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{aud.vague}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{aud.audience.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                          <button type="button" onClick={() => onEdit(aud)} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="h-4 w-4"/></button>
                          <button type="button" onClick={() => onDelete(aud.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}