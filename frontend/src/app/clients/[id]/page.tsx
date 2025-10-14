'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useReferences } from '@/hooks/useReferences';
import { Audience } from '@/types';
import { useApi } from '@/hooks/useApi';

import ClientPageHeader from '@/components/clients/ClientPageHeader';
import AudienceFormModal from '@/components/AudienceFormModal';
import ClientAudienceCard from '@/components/ClientAudienceCard';
import DerniereAudienceCard from '@/components/DerniereAudienceCard';
import LogoUploader from '@/components/LogoUploader';
import ContactsCard from '@/components/ContactsCard';
import ClientDetailsCard from '@/components/ClientDetailsCard';
import SizingCard from '@/components/SizingCard';
import ConfigServicesCard from '@/components/ConfigServicesCard';
import CommercialActionsHistory from '@/components/clients/CommercialActionsHistory';
import ErrorBoundary from '@/components/ErrorBoundary';
import ClientQuotesList from '@/components/clients/ClientQuotesList';
import ConfirmationModal from '@/components/ConfirmationModal';

function ClientDetailCore() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  const api = useApi();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [editingAudience, setEditingAudience] = useState<Audience | null>(null);
  const [savingAudience, setSavingAudience] = useState(false);
  
  const { references, loading: refsLoading, error: refsError } = useReferences();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Pas besoin de re-déclencher le loading ici s'il est déjà à true
      setLoading(true);
      const data = await api.get(`/clients/${clientId}`);
      setClient(data);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les données du client.");
    } finally {
      setLoading(false);
    }
  }, [api, clientId]);

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId, fetchData]);

  const { prevClientId, nextClientId } = useMemo(() => {
    const clientIdsString = searchParams.get('client_ids');
    if (!clientIdsString) return { prevClientId: null, nextClientId: null };

    const clientIds = clientIdsString.split(',').map(id => parseInt(id, 10));
    const currentIndex = clientIds.indexOf(parseInt(clientId, 10));

    if (currentIndex === -1) return { prevClientId: null, nextClientId: null };

    const prevId = currentIndex > 0 ? clientIds[currentIndex - 1] : null;
    const nextId = currentIndex < clientIds.length - 1 ? clientIds[currentIndex + 1] : null;

    return { prevClientId: prevId, nextClientId: nextId };
  }, [clientId, searchParams]);
  
  const totalRevenue = useMemo(() => {
    if (!client) return { annuel: 0, mensuel: 0 };
    const servicesRevenue = client.services?.reduce((acc: number, service: any) => acc + (parseFloat(service.valeur_mensuelle) || 0), 0) || 0;
    const totalMensuel = (
      (parseFloat(client.revenus_programmation_mensuel) || 0) +
      (parseFloat(client.revenus_diffusion_mensuel) || 0) +
      (parseFloat(client.revenus_planification_mensuel) || 0) +
      (parseFloat(client.revenus_streaming_mensuel) || 0) +
      servicesRevenue
    );
    return {
      annuel: totalMensuel * 12,
      mensuel: totalMensuel
    };
  }, [client]);

  const openAudienceModal = (audience: Audience | null) => {
    setEditingAudience(audience);
    setShowAudienceModal(true);
  };

  const handleSaveAudience = async (audienceData: any) => {
    setSavingAudience(true);
    try {
      if (editingAudience) {
        await api.put(`/audiences/${editingAudience.id}`, { ...audienceData, client_id: clientId });
      } else {
        await api.post('/audiences', { ...audienceData, client_id: clientId });
      }
      setShowAudienceModal(false);
      fetchData();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'audience:", error);
    } finally {
      setSavingAudience(false);
    }
  };

  const handleDeleteAudience = async (audienceId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette audience ?')) {
      try {
        await api.del(`/audiences/${audienceId}`);
        fetchData();
      } catch (error) {
        console.error("Erreur lors de la suppression de l'audience:", error);
      }
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await api.del(`/contacts/${contactId}`);
      fetchData();
    } catch (error) {
      console.error("Erreur lors de la suppression du contact:", error);
    }
  };
  
  const handleDeleteClient = async () => {
    setDeleting(true);
    try {
      await api.del(`/clients/${clientId}`);
      router.push('/clients?deleted=true');
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading || refsLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (error || refsError) {
    return <div className="text-red-500 text-center p-8">Erreur: {error || refsError}</div>;
  }

  if (!client) {
    return <div className="text-center p-8">Aucun client trouvé.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ClientPageHeader 
        client={client}
        prevClientId={prevClientId}
        nextClientId={nextClientId}
        onDelete={() => setShowDeleteModal(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LogoUploader logoUrl={client.logo_url} clientId={clientId} clientName={client.nom_radio} onUploadSuccess={fetchData} />
          <ErrorBoundary>
            <ClientDetailsCard client={client} clientId={Number(clientId)} />
          </ErrorBoundary>
          <SizingCard client={client} />
          <ConfigServicesCard client={client} totalRevenue={totalRevenue} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <ContactsCard 
            contacts={client.contacts || []} 
            clientId={clientId} 
            clientName={client.nom_radio}
            clientGroupName={client.nom_groupe}
            references={references} 
            onContactsUpdated={fetchData}
            onDeleteContact={handleDeleteContact}
          />
          <DerniereAudienceCard audiences={client.audiences || []} />
        </div>
      </div>
      
      <ClientAudienceCard 
        audiences={client.audiences || []} 
        onAdd={() => openAudienceModal(null)}
        onEdit={openAudienceModal}
        onDelete={handleDeleteAudience}
      />

      <CommercialActionsHistory clientId={Number(clientId)} />

      <ClientQuotesList clientId={Number(clientId)} />

      {showAudienceModal && references?.types_audience && (
        <AudienceFormModal 
          audience={editingAudience} 
          onSave={handleSaveAudience} 
          onCancel={() => setShowAudienceModal(false)} 
          saving={savingAudience} 
          audienceTypes={references.types_audience}
          availableVagues={references.vagues || []}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Confirmer la suppression"
          message={`Êtes-vous sûr de vouloir supprimer définitivement <strong>${client.nom_radio}</strong> et toutes ses données associées (contacts, devis, actions...) ?`}
          onConfirm={handleDeleteClient}
          onCancel={() => setShowDeleteModal(false)}
          isConfirming={deleting}
        />
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <ClientDetailCore />
    </Suspense>
  );
}

