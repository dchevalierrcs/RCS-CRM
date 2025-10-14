// frontend/src/app/clients/page.tsx
'use client';

import { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Search, Users, Globe, BookUser, 
  Database, Star, Target, HelpCircle, Trash2
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';

import ClientStatCard from '@/components/clients/ClientStatCard';
import ClientsTable from '@/components/clients/ClientsTable';
import FilterShortcutCard from '@/components/clients/FilterShortcutCard';

interface Client {
  id: number;
  nom_radio: string;
  nom_groupe?: string;
  contact_principal?: string;
  groupement?: string;
  groupement_id?: number;
  chiffre_annuel?: number;
  type_marche?: string;
  type_marche_code?: string;
  type_marche_id?: number;
  statut_juridique?: string;
  types_diffusion?: string[];
  statut_client: 'Client' | 'Prospect' | 'Non Client';
  rcs_icons?: (string | null)[];
  // Ajout des logiciels pour le filtrage
  logiciel_programmation?: string;
  logiciel_diffusion?: string;
  logiciel_planification?: string;
}

function ClientPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const statutFilter = searchParams.get('statut');
  const shortcutFilter = searchParams.get('filter');
  const groupFilter = searchParams.get('group');
  const softwareFilter = searchParams.get('software');
  const initialSearch = searchParams.get('q') || '';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const api = useApi();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/clients');
      setClients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleFilterClick = (paramName: 'statut' | 'filter' | 'all', paramValue: string | null) => {
    const params = new URLSearchParams(window.location.search);

    // Supprimer tous les filtres existants pour en appliquer un nouveau
    ['statut', 'filter', 'group', 'software'].forEach(p => params.delete(p));

    if (paramName !== 'all' && paramValue) {
      params.set(paramName, paramValue);
    }
    
    router.push(`/clients?${params.toString()}`);
  };
  
  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      await api.del(`/clients/${clientToDelete.id}`);
      setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredClients = useMemo(() => {
    let tempClients = clients;

    if (statutFilter) {
      tempClients = tempClients.filter(c => c.statut_client === statutFilter);
    }

    if (shortcutFilter) {
      switch (shortcutFilter) {
        case 'indes_radio':
          tempClients = tempClients.filter(c => c.groupement_id === 1);
          break;
        case 'national':
          tempClients = tempClients.filter(c => [4, 5].includes(c.type_marche_id || 0));
          break;
        case 'associatif':
          tempClients = tempClients.filter(c => c.type_marche_id === 1);
          break;
      }
    }

    if (groupFilter) {
      tempClients = tempClients.filter(c => c.nom_groupe === groupFilter);
    }

    if (softwareFilter) {
      tempClients = tempClients.filter(c => 
        c.logiciel_programmation === softwareFilter ||
        c.logiciel_diffusion === softwareFilter ||
        c.logiciel_planification === softwareFilter
      );
    }

    const term = searchTerm.toLowerCase();
    if (term) {
       tempClients = tempClients.filter(client => (
        client.nom_radio?.toLowerCase().includes(term) ||
        client.nom_groupe?.toLowerCase().includes(term) ||
        client.contact_principal?.toLowerCase().includes(term) ||
        client.groupement?.toLowerCase().includes(term)
      ));
    }
    
    return tempClients;
  }, [clients, statutFilter, shortcutFilter, groupFilter, softwareFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: clients.length,
    clients: clients.filter(c => c.statut_client === 'Client').length,
    prospects: clients.filter(c => c.statut_client === 'Prospect').length,
    nonClients: clients.filter(c => c.statut_client === 'Non Client').length,
  }), [clients]);

  const indesRadioStats = useMemo(() => {
    const indesRadios = clients.filter(c => c.groupement_id === 1);
    const clientCount = indesRadios.filter(c => c.statut_client === 'Client').length;
    const totalCount = indesRadios.length;
    return `${clientCount}/${totalCount}`;
  }, [clients]);
  
  const clientIdsForNavigation = filteredClients.map(c => c.id).join(',');

  if (loading) {
    return <div className="text-center p-8">Chargement des clients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-600 mt-2">Gérez votre portefeuille de radios</p>
        </div>
        <Link href="/clients/nouveau" className="btn-modern btn-primary">
          <Plus className="h-4 w-4" />
          Nouveau Client
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ClientStatCard title="Total" value={stats.total} Icon={Database} color="blue" isActive={!statutFilter && !shortcutFilter && !groupFilter && !softwareFilter} onClick={() => handleFilterClick('all', null)} />
        <ClientStatCard title="Clients" value={stats.clients} Icon={Star} color="green" isActive={statutFilter === 'Client'} onClick={() => handleFilterClick('statut', 'Client')} />
        <ClientStatCard title="Prospects" value={stats.prospects} Icon={Target} color="orange" isActive={statutFilter === 'Prospect'} onClick={() => handleFilterClick('statut', 'Prospect')} />
        <ClientStatCard title="Non-Clients" value={stats.nonClients} Icon={HelpCircle} color="purple" isActive={statutFilter === 'Non Client'} onClick={() => handleFilterClick('statut', 'Non Client')} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <FilterShortcutCard 
          title="Indés Radio" 
          imageUrl="/icons/indesradios.png" 
          onClick={() => handleFilterClick('filter', 'indes_radio')} 
          isActive={shortcutFilter === 'indes_radio'} 
          stats={indesRadioStats}
        />
        <FilterShortcutCard title="National" description="Marché D & E" Icon={Globe} onClick={() => handleFilterClick('filter', 'national')} isActive={shortcutFilter === 'national'} />
        <FilterShortcutCard title="Associatif" Icon={BookUser} onClick={() => handleFilterClick('filter', 'associatif')} isActive={shortcutFilter === 'associatif'} />
        <FilterShortcutCard isEmpty={true} />
        <FilterShortcutCard isEmpty={true} />
        <FilterShortcutCard title="Toutes les radios" Icon={Users} onClick={() => handleFilterClick('all', null)} isActive={!statutFilter && !shortcutFilter && !groupFilter && !softwareFilter} />
      </div>

      <div className="dashboard-card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher par radio, groupe, contact..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
          />
        </div>
      </div>
      
      <ClientsTable
        clients={filteredClients}
        clientIdsForNavigation={clientIdsForNavigation}
        onDeleteClick={handleDeleteClick}
      />

      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md mx-4">
             <div className="flex items-center space-x-3 mb-4">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                 <Trash2 className="h-6 w-6 text-red-600" />
               </div>
               <div>
                 <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                 <p className="text-gray-600">Cette action est irréversible</p>
               </div>
             </div>
             <p className="text-gray-700 mb-6">Êtes-vous sûr de vouloir supprimer définitivement <strong>{clientToDelete.nom_radio}</strong> et toutes ses données associées ?</p>
             <div className="flex space-x-3 justify-end">
               <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-modern btn-secondary" disabled={deleting}>Annuler</button>
               <button type="button" onClick={handleDeleteConfirm} className="btn-modern bg-red-600 text-white hover:bg-red-700" disabled={deleting}>{deleting ? 'Suppression...' : 'Supprimer définitivement'}</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div>Chargement de la recherche...</div>}>
      <ClientPageComponent />
    </Suspense>
  );
}