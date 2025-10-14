'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import GoogleMapComponent from '@/components/GoogleMapComponent';
import { useApi } from '@/hooks/useApi'; // <-- MODIFICATION 1: On importe l'assistant

interface GroupMember {
  id: number;
  nom_radio: string;
}

interface ClientDetails {
  nom_groupe?: string;
  raison_sociale?: string;
  groupement_nom?: string;
  adresse?: string;
}

interface Props {
  client: ClientDetails;
  clientId: number;
}

const InfoPair = ({ label, value, onMouseEnter }: { label: string; value: React.ReactNode; onMouseEnter?: () => void }) => (
  <div onMouseEnter={onMouseEnter}>
    <p className="text-sm font-bold text-gray-700 mb-1">{label}</p>
    <p className="font-semibold text-gray-800 whitespace-pre-wrap">{value || '-'}</p>
  </div>
);

export default function ClientDetailsCard({ client, clientId }: Props) {
  const api = useApi(); // <-- MODIFICATION 2: On initialise l'assistant
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  let hidePopupTimeout: NodeJS.Timeout;

  const handleGroupHover = async () => {
    clearTimeout(hidePopupTimeout);
    setIsPopupVisible(true);
    
    if (client.nom_groupe && groupMembers.length === 0 && !isLoading) {
      setIsLoading(true);
      try {
        // <-- MODIFICATION 3: On utilise l'assistant au lieu de 'fetch'
        const result = await api.get(`/clients/by-group/${encodeURIComponent(client.nom_groupe)}`);
        
        // On filtre pour ne pas afficher le client actuel dans la liste
        const otherMembers = result.filter((member: GroupMember) => member.id !== clientId);
        setGroupMembers(otherMembers);
        
      } catch (error) {
        console.error("Erreur lors de la récupération des membres du groupe:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMouseLeave = () => {
    hidePopupTimeout = setTimeout(() => {
      setIsPopupVisible(false);
    }, 200);
  };
  
  const handlePopupMouseEnter = () => {
    clearTimeout(hidePopupTimeout);
  };

  return (
    <div className="dashboard-card p-4">
      <h3 className="card-title font-bold text-lg flex items-center mb-4">
        <FileText className="h-5 w-5 mr-2" />
        Détails du Client
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative" onMouseLeave={handleMouseLeave}>
          <InfoPair 
            label="Groupe" 
            value={client.nom_groupe}
            onMouseEnter={client.nom_groupe ? handleGroupHover : undefined}
          />
          {isPopupVisible && client.nom_groupe && (
            <div 
              className="absolute z-10 top-full mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-sm animate-fade-in"
              onMouseEnter={handlePopupMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {isLoading ? (
                <p className="text-gray-500">Chargement...</p>
              ) : groupMembers.length > 0 ? (
                <>
                  <p className="font-bold text-gray-800 mb-2">Autres radios du groupe :</p>
                  <ul className="space-y-1">
                    {groupMembers.map(member => (
                      <li key={member.id}>
                        <Link href={`/clients/${member.id}`} className="text-blue-600 hover:underline hover:font-semibold">
                          {member.nom_radio}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-500">Aucune autre radio dans ce groupe.</p>
              )}
            </div>
          )}
        </div>
        <InfoPair label="Raison Sociale" value={client.raison_sociale} />
        <InfoPair label="Groupement" value={client.groupement_nom} />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div>
          <InfoPair label="Adresse" value={client.adresse} />
        </div>
        
        <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 min-h-[200px]">
          <GoogleMapComponent address={client.adresse || ''} />
        </div>
        
      </div>
    </div>
  );
}