import { Database, Star, Target, Eye } from 'lucide-react'; // Icônes mises à jour
import Link from 'next/link';

interface Props {
  data?: {
    total: number;
    clients: number;
    prospects: number;
  };
  loading: boolean;
}

const StatItem = ({ icon: Icon, title, value, color, loading, href }: any) => (
  <div>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '...' : value}
          </p>
        </div>
      </div>
      {!loading && (
        <Link href={href} className="flex items-center text-xs font-semibold text-blue-600 hover:underline">
          Voir
          <Eye className="h-3 w-3 ml-1" />
        </Link>
      )}
    </div>
  </div>
);

export default function DashboardStatCard({ data, loading }: Props) {
  return (
    <div className="dashboard-card space-y-5">
      <StatItem 
        icon={Database} // Icône mise à jour
        title="Radios Total" 
        value={data?.total} 
        color="blue" 
        loading={loading}
        href="/clients"
      />
      <hr />
      <StatItem 
        icon={Star} // Icône mise à jour
        title="Clients" 
        value={data?.clients} 
        color="green" 
        loading={loading}
        href="/clients?statut=Client"
      />
      <hr />
      <StatItem 
        icon={Target} // Icône mise à jour
        title="Prospects" 
        value={data?.prospects} 
        color="orange" 
        loading={loading}
        href="/clients?statut=Prospect"
      />
    </div>
  );
}