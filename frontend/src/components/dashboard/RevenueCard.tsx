import { Euro } from 'lucide-react';

interface Props {
  data?: {
    global: number;
    indesRadio: number;
  };
  loading: boolean;
}

// Fonction de formatage de la devise
const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '...';
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        maximumFractionDigits: 0 
    }).format(value);
}

// Sous-composant pour chaque ligne de revenu pour un code plus propre
const RevenueLine = ({ title, value, loading, colorClass }: { title: string; value: number | undefined; loading: boolean; colorClass: string }) => (
  <div>
    <div className={`flex items-center text-sm font-medium text-gray-600`}>
        <span className={`h-2 w-2 rounded-full mr-3 ${colorClass}`}></span>
        {title}
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-1 ml-5">
        {loading ? '...' : formatCurrency(value)}
    </p>
  </div>
);

export default function RevenueCard({ data, loading }: Props) {
  return (
    <div className="dashboard-card">
        {/* En-tête de la carte */}
        <div className="flex items-start justify-between mb-4">
            <h4 className="font-bold text-gray-800">Chiffre d'Affaires Annuel</h4>
            <div className="p-3 bg-purple-100 rounded-xl">
                <Euro className="h-6 w-6 text-purple-600" />
            </div>
        </div>
        
        {/* Contenu avec les chiffres */}
        <div className="space-y-5 pt-2">
            <RevenueLine 
              title="Global" 
              value={data?.global} 
              loading={loading} 
              colorClass="bg-purple-500" 
            />
            <hr/>
            <RevenueLine 
              title="Groupement Indés Radios" 
              value={data?.indesRadio} 
              loading={loading} 
              colorClass="bg-blue-500" 
            />
        </div>
    </div>
  );
}
