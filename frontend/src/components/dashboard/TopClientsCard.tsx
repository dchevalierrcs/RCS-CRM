import Link from 'next/link';
import { Award } from 'lucide-react';

interface Client {
  id: number;
  nom_radio: string;
  revenue: number;
  pays?: string;
  code_iso?: string;
}

interface Props {
  data?: Client[];
  loading: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export default function TopClientsCard({ data, loading }: Props) {
  return (
    <div className="dashboard-card">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center">
        <Award className="h-5 w-5 mr-2 text-yellow-500" />
        Top 10 Clients (CA)
      </h4>
      <ol className="space-y-1">
        {loading 
          ? [...Array(5)].map((_, i) => <li key={i}><div className="h-8 bg-gray-200 rounded animate-pulse"></div></li>)
          : data?.map((client, index) => (
              <li key={client.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Link href={`/clients/${client.id}`} className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                  <span className="font-medium text-gray-800">{client.nom_radio}</span>
                  {client.code_iso && (
                    <img
                      src={`https://flagcdn.com/w20/${client.code_iso.toLowerCase()}.png`}
                      alt={`Drapeau ${client.pays}`}
                      title={client.pays}
                      className="h-3 rounded-sm self-center"
                    />
                  )}
                </Link>
                <span className="font-semibold text-gray-900">{formatCurrency(client.revenue)}</span>
              </li>
            ))
        }
      </ol>
    </div>
  );
}

