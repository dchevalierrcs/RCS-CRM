'use client';

import Link from 'next/link';
import {
  Edit, ArrowLeft, Trash2, FilePlus, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

interface Props {
  client: {
    id: number;
    nom_radio: string;
    nom_groupe: string;
    statut_client: 'Client' | 'Prospect' | 'Non Client';
  };
  prevClientId: number | null;
  nextClientId: number | null;
  onDelete: () => void;
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Client':
      return 'bg-green-100 text-green-800';
    case 'Prospect':
      return 'bg-yellow-100 text-yellow-800';
    case 'Non Client':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ClientPageHeader({ client, prevClientId, nextClientId, onDelete }: Props) {
  const { user } = useAuth();
  const clientIdsParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('client_ids') : null;

  const buildClientLink = (id: number | null) => {
    if (!id) return '#';
    return `/clients/${id}${clientIdsParam ? `?client_ids=${clientIdsParam}` : ''}`;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="btn-icon btn-secondary hidden sm:flex">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center">
            <Link href={buildClientLink(prevClientId)} className={`btn-icon btn-secondary ${!prevClientId ? 'opacity-50 cursor-not-allowed' : ''}`} aria-disabled={!prevClientId}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href={buildClientLink(nextClientId)} className={`btn-icon btn-secondary ${!nextClientId ? 'opacity-50 cursor-not-allowed' : ''}`} aria-disabled={!nextClientId}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{client.nom_radio}</h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(client.statut_client)}`}>
              {client.statut_client}
            </span>
          </div>
          <p className="text-gray-600 mt-1">{client.nom_groupe}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {user && (user.role === 'admin' || user.role === 'editor') && (
          <>
            <Link href={`/quotes/nouveau?clientId=${client.id}`} className="btn-modern btn-primary bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
              <FilePlus className="h-4 w-4" />
              Créer un devis
            </Link>
            <Link href={`/clients/${client.id}/edit`} className="btn-modern btn-secondary flex-1 sm:flex-none">
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
            <button onClick={onDelete} className="btn-modern bg-red-600 text-white hover:bg-red-700 flex-1 sm:flex-none">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

