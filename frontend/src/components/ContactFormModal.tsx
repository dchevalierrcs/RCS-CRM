'use client';

import { useState, useMemo, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { Contact } from '@/types';

interface Props {
  contact: Contact | null;
  onSave: (data: Contact) => void;
  onCancel: () => void;
  saving: boolean;
  clientName: string;
  references: any;
}

export default function ContactFormModal({ contact, onSave, onCancel, saving, clientName, references }: Props) {
  const [formData, setFormData] = useState<Contact>({
    id: contact?.id || undefined,
    nom: contact?.nom || '',
    telephone: contact?.telephone || '',
    email: contact?.email || '',
    est_contact_principal: contact?.est_contact_principal || false,
    roles: contact?.roles || ['contact_principal']
  });

  // Ce hook permet de mettre à jour le formulaire si le contact à éditer change
  useEffect(() => {
    setFormData({
      id: contact?.id || undefined,
      nom: contact?.nom || '',
      telephone: contact?.telephone || '',
      email: contact?.email || '',
      est_contact_principal: contact?.est_contact_principal || false,
      roles: contact?.roles || ['contact_principal']
    });
  }, [contact]);

  const roleOptions = useMemo(() => {
    if (!Array.isArray(references?.roles_contact)) {
      return [];
    }
    return references.roles_contact.map((role: { id: number; code: string; nom: string }) => ({
      id: role.id,
      value: role.code,
      label: role.nom,
    }));
  }, [references]);

  const handleRoleChange = (roleValue: string, checked: boolean) => {
    if (typeof roleValue === 'undefined') { return; }
    
    if (checked) {
      setFormData(prev => ({ ...prev, roles: [...(prev.roles || []), roleValue] }));
    } else {
      setFormData(prev => ({ ...prev, roles: (prev.roles || []).filter(role => role !== roleValue) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Largeur augmentée de 'max-w-md' à 'max-w-lg' */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{contact ? 'Modifier le contact' : 'Nouveau contact'}</h3>
                  <p className="text-blue-100 text-sm">{clientName}</p>
                </div>
              </div>
              <button onClick={onCancel} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du contact *</label>
              <input type="text" required value={formData.nom} onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Jean Dupont" disabled={saving} autoComplete="off" />
            </div>
            {/* Grille modifiée en 'md:grid-cols-2' pour la lisibilité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label><input type="tel" value={formData.telephone} onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" placeholder="01.23.45.67.89" disabled={saving} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" placeholder="contact@radio.fr" /></div>
            </div>
            <div>
              {/* CORRECTION: </Sabel> remplacé par </label> */}
              <label className="block text-sm font-medium text-gray-700 mb-3">Rôles</label>
              {/* Passage des rôles en 2 colonnes */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {roleOptions.map((role: { id: number; value: string; label: string }) => (
                  <label key={role.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={(formData.roles || []).includes(role.value)} onChange={(e) => handleRoleChange(role.value, e.target.checked)} className="mr-3 h-4 w-4 text-blue-600" disabled={saving} />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.est_contact_principal} onChange={(e) => setFormData(prev => ({ ...prev, est_contact_principal: e.target.checked }))} className="mr-3 h-4 w-4 text-blue-600" disabled={saving} />
                <div>
                  <span className="text-sm font-medium">Contact principal</span>
                  <p className="text-xs text-gray-500">Ce contact sera prioritaire pour les communications</p>
                </div>
              </label>
            </div>
            <div className="flex space-x-3 justify-end pt-6 border-t">
              <button type="button" onClick={onCancel} className="btn-modern btn-secondary" disabled={saving}>Annuler</button>
              <button type="submit" className="btn-modern btn-primary" disabled={saving}>{saving ? 'Sauvegarde...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}