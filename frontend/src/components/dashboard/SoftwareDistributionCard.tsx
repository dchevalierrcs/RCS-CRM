import Link from 'next/link';

interface Software {
  name: string;
  count: number;
  logoUrl: string;
}

interface Props {
  data?: Software[];
  loading: boolean;
}

export default function SoftwareDistributionCard({ data, loading }: Props) {
  return (
    <div className="dashboard-card">
      <h4 className="font-bold text-gray-800 mb-4">Installations Logiciels RCS</h4>
      <div className="space-y-3">
        {loading 
          ? [...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>)
          : data?.map(software => (
              <Link 
                key={software.name} 
                href={`/clients?software=${encodeURIComponent(software.name)}`}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img src={software.logoUrl} alt={`Logo ${software.name}`} className="h-8 w-8 object-contain" />
                  <span className="font-medium text-gray-700">{software.name}</span>
                </div>
                <span className="font-bold text-lg text-gray-900">{software.count}</span>
              </Link>
            ))
        }
      </div>
    </div>
  );
}