'use client';

import { useState, useEffect } from 'react';
import { Import, X, Users, ChevronRight, Check } from 'lucide-react';
import { Contact } from '@/types';

// Type pour les membres du groupe (simplifié)
interface GroupMember {
  id: number;
  nom_radio: string;
}
// Type pour les props du modal
interface Props {
  onCancel: () => void;
  onImport: (contactsToImport: Contact[]) => void;
  clientGroupName: string;
  currentClientId: string;
  saving: boolean;
}

export default function ImportContactModal({ onCancel, onImport, clientGroupName, currentClientId, saving }: Props) {
  const [loadingStep, setLoadingStep] = useState<'group' | 'contacts' | 'idle'>('group');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedRadio, setSelectedRadio] = useState<GroupMember | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  // Étape 1: Charger les membres du groupe au démarrage
  useEffect(() => {
    if (!clientGroupName) {
      setLoadingStep('idle');
      return;
    }
    
    const fetchGroupMembers = async () => {
      setLoadingStep('group');
      try {
        const response = await fetch(`http://localhost:5000/api/clients/by-group/${encodeURIComponent(clientGroupName)}`);
        const result = await response.json();
        if (result.success) {
          // On filtre pour ne pas s'afficher soi-même
          const otherMembers = result.data.filter((member: GroupMember) => member.id !== Number(currentClientId));
          setGroupMembers(otherMembers);
        }
      } catch (error) {
        console.error("Erreur chargement membres du groupe:", error);
      } finally {
        setLoadingStep('idle');
      }
    };
    fetchGroupMembers();
  }, [clientGroupName, currentClientId]);

  // Étape 2: Charger les contacts quand une radio est sélectionnée
  useEffect(() => {
    if (!selectedRadio) {
      setContacts([]);
      setSelectedContactIds([]);
      return;
    }

    const fetchContacts = async () => {
      setLoadingStep('contacts');
      try {
        // Note: On suppose que cette route API existe (ex: /api/contacts?clientId=123)
        // Si elle n'existe pas, il faudra la créer.
        const response = await fetch(`http://localhost:5000/api/contacts?clientId=${selectedRadio.id}`);
        const result = await response.json();
        if (result.success) {
          setContacts(result.data);
        } else {
          // Si l'API /api/contacts?clientId=... n'existe pas, on fallback sur l'API client complète
          const clientRes = await fetch(`http://localhost:5000/api/clients/${selectedRadio.id}`);
          const clientResult = await clientRes.json();
          if (clientResult.success) {
            setContacts(clientResult.data.contacts || []);
          }
        }
      } catch (error) {
        console.error("Erreur chargement contacts:", error);
      } finally {
        setLoadingStep('idle');
      }
    };
    fetchContacts();
  }, [selectedRadio]);

  const handleToggleContact = (contactId: number) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSubmit = () => {
    const contactsToImport = contacts.filter(c => selectedContactIds.includes(c.id!));
    onImport(contactsToImport);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
          
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Import className="w-4 h-4 text-white" /></div>
                <h3 className="text-lg font-semibold text-white">Importer un contact du groupe</h3>
              </div>
              <button onClick={onCancel} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {/* Étape 1: Sélection de la radio */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">1. Choisir une radio du groupe</label>
                {loadingStep === 'group' && <p className="text-sm text-gray-500">Chargement des radios...</p>}
                {loadingStep !== 'group' && groupMembers.length === 0 && <p className="text-sm text-gray-500">Aucune autre radio trouvée dans ce groupe.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {groupMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedRadio(member)}
                      disabled={loadingStep !== 'idle'}
                      className={`flex justify-between items-center text-left w-full p-3 rounded-lg border transition-all ${selectedRadio?.id === member.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                    >
                      <span className="font-medium">{member.nom_radio}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Étape 2: Sélection des contacts */}
              {selectedRadio && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">2. Sélectionner les contacts à importer</label>
                  {loadingStep === 'contacts' && <p className="text-sm text-gray-500">Chargement des contacts...</p>}
                  {loadingStep === 'idle' && contacts.length === 0 && <p className="text-sm text-gray-500">Aucun contact trouvé pour {selectedRadio.nom_radio}.</p>}
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {contacts.map(contact => (
                      <label
                        key={contact.id}
                        className={`flex items-center w-full p-3 rounded-lg border cursor-pointer transition-all ${selectedContactIds.includes(contact.id!) ? 'bg-green-50 border-green-400' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id!)}
                          onChange={() => handleToggleContact(contact.id!)}
                          className="h-4 w-4 text-blue-600 mr-3"
                          disabled={saving}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{contact.nom}</p>
                          <p className="text-xs text-gray-500">{contact.email || contact.telephone}</p>
                        </div>
                        {selectedContactIds.includes(contact.id!) && <Check className="h-5 w-5 text-green-600" />}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 justify-end pt-6 border-t mt-6">
              <button type="button" onClick={onCancel} className="btn-modern btn-secondary" disabled={saving}>Annuler</button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-modern btn-primary"
                disabled={saving || selectedContactIds.length === 0}
              >
                {saving ? 'Importation...' : `Importer ${selectedContactIds.length} contact(s)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}