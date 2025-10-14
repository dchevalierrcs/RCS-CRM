import Link from 'next/link';
import { Clock } from 'lucide-react';

interface Client {
  id: number;
  nom_radio: string;
  nom_groupe?: string;
  responsable_nom?: string;
  statut_client: string;
}

interface Props {
  data?: Client[];
  loading: boolean;
}

const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Client': return 'bg-green-100 text-green-800';
      case 'Prospect': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
};

export default function RecentActivityCard({ data, loading }: Props) {
  return (
    <div className="dashboard-card">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2 text-gray-500" />
        Dernières Fiches Modifiées
      </h4>
      <ul className="space-y-2">
        {loading 
          ? [...Array(5)].map((_, i) => <li key={i}><div className="h-10 bg-gray-200 rounded animate-pulse"></div></li>)
          : data?.map(client => (
              <li key={client.id} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Link href={`/clients/${client.id}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{client.nom_radio}</p>
                      <p className="text-xs text-gray-500">{client.nom_groupe || 'Indépendant'} - {client.responsable_nom || 'N/A'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(client.statut_client)}`}>
                      {client.statut_client}
                    </span>
                  </div>
                </Link>
              </li>
            ))
        }
      </ul>
    </div>
  );
}
