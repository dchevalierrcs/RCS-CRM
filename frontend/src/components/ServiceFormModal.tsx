'use client';

import { useState, useEffect } from 'react';
import { ClientService, Service } from '@/types'; 
import { X, Loader2 } from 'lucide-react';

interface Props {
  service: ClientService | null;
  onSave: (service: ClientService) => void;
  onCancel: () => void;
  saving: boolean;
  clientServices: ClientService[];
  references: {
    services?: Service[];
  };
}

export default function ServiceFormModal({ 
  service, 
  onSave, 
  onCancel, 
  saving, 
  clientServices, 
  references = {} // Correction : Ajout d'une valeur par défaut
}: Props) {
  const [formData, setFormData] = useState({
    service_id: service?.service_id || '',
    valeur_mensuelle: service?.valeur_mensuelle || '',
  });

  useEffect(() => {
    setFormData({
      service_id: service?.service_id || '',
      valeur_mensuelle: service?.valeur_mensuelle || '',
    });
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_id) return;
    
    const selectedService = (references.services || []).find(s => s.id === Number(formData.service_id));
    if (!selectedService) return;

    onSave({
      service_id: Number(formData.service_id),
      valeur_mensuelle: parseFloat(String(formData.valeur_mensuelle).replace(',', '.')) || 0,
      nom: selectedService.nom,
      categorie: selectedService.categorie,
      permet_plusieurs_instances: selectedService.permet_plusieurs_instances,
    });
  };
  
  const availableServices = (references.services || []).filter(s => {
    if (s.permet_plusieurs_instances) return true;
    if (service && s.id === service.service_id) return true;
    return !clientServices.some(cs => cs.service_id === s.id);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{service ? 'Modifier le service' : 'Ajouter un service'}</h3>
            <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-100"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData(prev => ({...prev, service_id: e.target.value}))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!service} // Désactivé en mode édition
              >
                <option value="">Sélectionnez un service</option>
                {availableServices.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant mensuel (€)</label>
              <input 
                type="number"
                step="0.01"
                value={formData.valeur_mensuelle}
                onChange={(e) => setFormData(prev => ({...prev, valeur_mensuelle: e.target.value}))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                placeholder="Ex: 150.00"
              />
            </div>
            <div className="flex space-x-3 justify-end pt-4 border-t">
              <button type="button" onClick={onCancel} className="btn-modern btn-secondary" disabled={saving}>Annuler</button>
              <button type="submit" className="btn-modern btn-primary" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}