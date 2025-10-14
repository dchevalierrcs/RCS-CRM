// /src/app/analytics/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import AnalyticsFilters from '@/components/analytics/AnalyticsFilters';
import AnalyticsKPIs from '@/components/analytics/AnalyticsKPIs';
import AnalyticsTable from '@/components/analytics/AnalyticsTable';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import SearchBar from '@/components/analytics/SearchBar';

// Interfaces pour typer les données
interface AnalyticsData {
  groupBy: string;
  results: any[];
  totalClients: number;
  totalRevenue: number;
  totalAudience: number;
}

interface FilterOptions {
  logiciels: any[];
  types_diffusion: any[];
  pays: any[];
  types_marche: any[];
  statuts_client: any[];
}

interface SearchSuggestion {
  id?: number;
  name: string;
  type: 'radio' | 'groupe';
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  
  const [groupBy, setGroupBy] = useState('statut_client');
  const [filters, setFilters] = useState({});
  
  const [search, setSearch] = useState<{ id: string | number | null; type: 'radio' | 'groupe' | null }>({ id: null, type: null });

  const api = useApi();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      const params = new URLSearchParams({
        groupBy,
        ...filters,
        ...(search.type === 'radio' && search.id && { clientId: String(search.id) }),
        ...(search.type === 'groupe' && search.id && { nom_groupe: String(search.id) }),
      }).toString();

      try {
        const data = await api.get(`/analytics?${params}`);
        setAnalyticsData(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des données d'analyse:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [api, groupBy, filters, search]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const data = await api.get('/references');
        setFilterOptions(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des options de filtre:", error);
      }
    };
    fetchFilterOptions();
  }, [api]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSearch = useCallback(async (debouncedSearch: string) => {
    if (debouncedSearch.length < 2) {
      return [];
    }
    try {
        const data = await api.get(`/search/suggestions?q=${debouncedSearch}`);
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
  }, [api]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <SearchBar 
            onSearch={handleSearch} 
            // --- CORRECTION APPLIQUÉE ICI ---
            // On s'assure que `item.id` qui peut être `undefined` devienne `null`
            onSelect={(item: SearchSuggestion) => setSearch({ id: item.type === 'radio' ? (item.id ?? null) : item.name, type: item.type })}
            onClear={() => setSearch({ id: null, type: null })}
        />
      </div>

      <AnalyticsKPIs data={analyticsData} loading={isLoading} />
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <AnalyticsFilters 
          options={filterOptions}
          onFilterChange={handleFilterChange}
          onGroupByChange={setGroupBy}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <AnalyticsTable data={analyticsData} loading={isLoading} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <AnalyticsCharts filters={filters} search={search} />
        </div>
      </div>
    </div>
  );
}