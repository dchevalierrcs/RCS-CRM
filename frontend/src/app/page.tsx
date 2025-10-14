'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import RevenueCard from '@/components/dashboard/RevenueCard';
import SoftwareDistributionCard from '@/components/dashboard/SoftwareDistributionCard';
import RecentActivityCard from '@/components/dashboard/RecentActivityCard';
import TopClientsCard from '@/components/dashboard/TopClientsCard';
import TopGroupsCard from '@/components/dashboard/TopGroupsCard';
import CommercialSummaryCard from '@/components/dashboard/CommercialSummaryCard';
import OngoingQuotesCard from '@/components/dashboard/OngoingQuotesCard';
import { useApi } from '@/hooks/useApi';

// --- INTERFACE MISE À JOUR ---
interface DashboardData {
  kpis: { total: number; clients: number; prospects: number; };
  revenue: { global: number; indesRadio: number; };
  softwareDistribution: { name: string; count: number; logoUrl: string; }[];
  recentClients: { id: number; nom_radio: string; nom_groupe?: string; responsable_nom?: string; statut_client: string; }[];
  topClients: { id: number; nom_radio: string; revenue: number; }[];
  topGroups: { nom_groupe: string; revenue: number; }[];
  commercialSummary: { id: number; action_type: string; follow_up_date: string; nom_radio: string; client_id: number; }[];
  ongoingQuotes: {
    id: number;
    quote_number: string;
    subject: string;
    emission_date: string;
    total_ttc: string;
    client_id: number;
    client_nom: string;
  }[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const api = useApi();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const data = await api.get('/dashboard');
        setDashboardData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données du dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [api]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="space-y-8">
        {/* SECTION A : KPIs et Répartitions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardStatCard data={dashboardData?.kpis} loading={loading} />
          <RevenueCard data={dashboardData?.revenue} loading={loading} />
          <SoftwareDistributionCard data={dashboardData?.softwareDistribution} loading={loading} />
        </div>

        {/* SECTION B : Activités & Suivi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivityCard data={dashboardData?.recentClients} loading={loading} />
          <OngoingQuotesCard data={dashboardData?.ongoingQuotes} loading={loading} />
          <CommercialSummaryCard data={dashboardData?.commercialSummary} loading={loading} />
        </div>

        {/* SECTION C : Classements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopClientsCard data={dashboardData?.topClients} loading={loading} />
          <TopGroupsCard data={dashboardData?.topGroups} loading={loading} />
        </div>

        {/* SECTION D : Recherche */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recherche Rapide</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Rechercher une radio, un groupe, un contact..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-base" 
            />
          </div>
          <div className="mt-4">
            {/* Le composant de résultats de recherche sera ajouté ici */}
          </div>
        </div>
      </div>
    </div>
  );
}

