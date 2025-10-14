'use client';

import { useMemo, useState } from 'react';
import { Users, Plus, Star, Mail, Phone, Edit, Trash2, Import } from 'lucide-react';
import { Contact } from '@/types';
import ContactFormModal from '@/components/ContactFormModal';
import ImportContactModal from '@/components/ImportContactModal';
// --- MODIFICATION : Remplacement de useAuth par useApi ---
import { useApi } from '@/hooks/useApi';

interface Props {
  contacts: Contact[];
  clientId: string; 
  clientName: string; 
  clientGroupName: string; 
  references: any;
  onContactsUpdated: () => void; 
  onDeleteContact: (contactId: number) => void; 
}

// Sous-composant pour une seule carte de contact (inchangé)
const ContactItem = ({ contact, references, onEdit, onDelete }: { contact: Contact; references: any; onEdit: () => void; onDelete: () => void; }) => {
  const roleLabels = useMemo(() => {
    if (!references?.roles_contact) return {};
    return references.roles_contact.reduce((acc: any, role: any) => {
      acc[role.code] = role.nom;
      return acc;
    }, {});
  }, [references]);

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 group hover:border-blue-400 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-bold text-gray-800 text-base">{contact.nom}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(contact.roles || []).map(roleCode => (
              <span key={roleCode} className="badge-gray !rounded-full text-xs">
                {roleLabels[roleCode] ?? roleCode}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md" title="Modifier le contact">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md" title="Supprimer le contact">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {contact.est_contact_principal && (
            <div title="Contact Principal">
              <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 space-y-2 text-sm">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center text-gray-600 hover:text-blue-600 hover:underline transition-colors">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {contact.telephone && (
          <a href={`tel:${contact.telephone}`} className="flex items-center text-gray-600 hover:text-blue-600 hover:underline transition-colors">
            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{contact.telephone}</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default function ContactsCard({ contacts, clientId, clientName, clientGroupName, references, onContactsUpdated, onDeleteContact }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // --- MODIFICATION : Instanciation du hook useApi ---
  const api = useApi();

  const handleOpenModal = (contact: Contact | null) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null); 
  };

  // --- MODIFICATION : Réécriture complète avec useApi ---
  const handleSaveContact = async (data: Contact) => {
    setIsSaving(true);
    const isEditing = !!data.id;
    
    try {
      if (isEditing) {
        // Pour PUT, le backend attend l'objet contact plat
        await api.put(`/contacts/${data.id}`, data);
      } else {
        // Pour POST, le backend attend { clientId, contactData }
        const { id, ...contactData } = data;
        const bodyData = {
          clientId: Number(clientId),
          contactData: contactData
        };
        await api.post('/contacts', bodyData);
      }
      onContactsUpdated();
      handleCloseModal();
    } catch (err: any) {
      // L'erreur est déjà formatée par le hook useApi
      alert(`Erreur lors de la sauvegarde : ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- MODIFICATION : Réécriture complète avec useApi ---
  const handleImportContacts = async (contactsToImport: Contact[]) => {
    setIsSaving(true);
    try {
      const importPromises = contactsToImport.map(contact => {
        const contactData = {
          nom: contact.nom,
          telephone: contact.telephone,
          email: contact.email,
          est_contact_principal: false,
          roles: contact.roles || []
        };
        
        const bodyData = {
          clientId: Number(clientId),
          contactData: contactData
        };

        return api.post('/contacts', bodyData);
      });

      await Promise.all(importPromises);
      
      onContactsUpdated();
      setShowImportModal(false);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'importation des contacts.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="dashboard-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title font-bold text-lg flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Contacts
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowImportModal(true)} 
              className="btn-modern btn-secondary text-xs" 
              title="Importer un contact depuis le groupe"
              disabled={!clientGroupName} 
            >
              <Import className="h-4 w-4" />
            </button>
            <button onClick={() => handleOpenModal(null)} className="btn-modern btn-primary text-xs">
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
        </div>
        {contacts?.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((c: Contact) => (
              <ContactItem 
                key={c.id} 
                contact={c} 
                references={references}
                onEdit={() => handleOpenModal(c)}
                onDelete={() => onDeleteContact(c.id!)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-4">Aucun contact.</p>
        )}
      </div>

      {showModal && (
        <ContactFormModal
          contact={editingContact}
          onSave={handleSaveContact}
          onCancel={handleCloseModal}
          saving={isSaving}
          clientName={clientName}
          references={references}
        />
      )}
      
      {showImportModal && (
        <ImportContactModal
          onCancel={() => setShowImportModal(false)}
          onImport={handleImportContacts}
          clientGroupName={clientGroupName}
          currentClientId={clientId}
          saving={isSaving}
        />
      )}
    </>
  );
}