import { Trophy } from 'lucide-react';
import Link from 'next/link';

interface Group {
  nom_groupe: string;
  revenue: number;
  pays?: string;
  code_iso?: string;
}

interface Props {
  data?: Group[];
  loading: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export default function TopGroupsCard({ data, loading }: Props) {
  return (
    <div className="dashboard-card">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center">
        <Trophy className="h-5 w-5 mr-2 text-orange-500" />
        Top 10 Groupes (CA)
      </h4>
      <div className="space-y-1">
        {loading 
          ? [...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>)
          : data?.map((group, index) => (
              <Link 
                key={group.nom_groupe} 
                href={`/clients?group=${encodeURIComponent(group.nom_groupe)}`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                  <span className="font-medium text-gray-800">{group.nom_groupe}</span>
                  {group.code_iso && (
                    <img
                      src={`https://flagcdn.com/w20/${group.code_iso.toLowerCase()}.png`}
                      alt={`Drapeau ${group.pays}`}
                      title={group.pays}
                      className="h-3 rounded-sm self-center"
                    />
                  )}
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(group.revenue)}</span>
              </Link>
            ))
        }
      </div>
    </div>
  );
}