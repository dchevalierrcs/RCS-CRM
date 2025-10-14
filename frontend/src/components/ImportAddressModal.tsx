// src/components/ImportAddressModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Home } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import NotificationModal from './NotificationModal'; // <-- Importer le nouveau composant

interface GroupMember {
  id: number;
  nom_radio: string;
}

interface Props {
  groupName: string;
  currentClientId: string;
  onAddressSelect: (address: string) => void;
  onClose: () => void;
}

export default function ImportAddressModal({ groupName, currentClientId, onAddressSelect, onClose }: Props) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  // <-- Nouvel état pour le modal de notification -->
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupName) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await api.get(`/clients/by-group/${encodeURIComponent(groupName)}`);
        setMembers(result.filter((member: GroupMember) => String(member.id) !== currentClientId));
      } catch (err) {
        setError('Impossible de charger la liste des radios du groupe.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupName, currentClientId, api]);

  const handleSelectClient = async (clientId: number) => {
    try {
      const clientDetails = await api.get(`/clients/${clientId}`);
      if (clientDetails && clientDetails.adresse) {
        onAddressSelect(clientDetails.adresse);
      } else {
        // <-- Utiliser le nouveau modal de notification au lieu de alert() -->
        setNotification({
          title: "Adresse non trouvée",
          message: "La radio sélectionnée n'a pas d'adresse enregistrée. Veuillez en choisir une autre ou saisir l'adresse manuellement."
        });
      }
    } catch (err) {
      setError("Erreur lors de la récupération de l'adresse.");
      console.error(err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 animate-fade-in-up">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Importer une adresse du groupe "{groupName}"</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center">
                <Loader2 className="animate-spin mr-2" />
                <span>Chargement...</span>
              </div>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : members.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-3">Cliquez sur une radio pour copier son adresse :</p>
                {members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectClient(member.id)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center"
                  >
                    <Home className="h-4 w-4 mr-3 text-gray-500"/>
                    <span className="font-medium text-gray-800">{member.nom_radio}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune autre radio trouvée dans ce groupe.</p>
            )}
          </div>
        </div>
      </div>

      {/* <-- Affichage conditionnel du modal de notification --> */}
      {notification && (
        <NotificationModal
          type="warning"
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}