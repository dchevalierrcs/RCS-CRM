// frontend/src/components/analytics/AnalyticsFilters.tsx
'use client';

import React from 'react';

const AnalyticsFilters = ({ options, onFilterChange, onGroupByChange }: any) => {
  if (!options) return <div className="text-center">Chargement des filtres...</div>;

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
      {/* Group by */}
      <div>
        <label htmlFor="groupBy" className="block text-sm font-medium text-gray-700">Regrouper par</label>
        <select
          id="groupBy"
          name="groupBy"
          onChange={(e) => onGroupByChange(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="statut_client">Statut Client</option>
          <option value="type_marche">Type de marché</option>
          <option value="pays">Pays</option>
          <option value="logiciel">Logiciel (Prog.)</option>
          <option value="type_diffusion">Type de diffusion</option>
        </select>
      </div>
      
      {/* Autres filtres */}
      {Object.entries(options).map(([key, value]: [string, any]) => (
        <div key={key}>
          <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</label>
          <select
            id={key}
            name={key}
            onChange={handleFilter}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Tous</option>
            {value.map((option: any) => (
              <option key={option.id || option.nom} value={option.id || option.nom}>{option.nom}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsFilters;