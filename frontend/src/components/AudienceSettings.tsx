// frontend/src/components/AudienceSettings.tsx

'use client';

import { useState, useEffect } from 'react';
import { useCRUDReferences } from '@/hooks/useCRUDReferences';
import { Plus, Edit, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { TypeAudience, Vague } from '@/types';

// Interface pour le formulaire (peut gérer Type ou Vague)
interface FormModalData {
  nom: string;
  annee?: number;
}

// --- AJOUT : Définition du type de retour pour la clarté ---
// Ce type est basé sur le message d'erreur et les conventions standard
type MutationResult = {
  success: boolean;
  data?: any;
  message?: string;
};

export default function AudienceSettings() {
  const [selectedType, setSelectedType] = useState<TypeAudience | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'type' | 'vague'>('type');
  const [editingItem, setEditingItem] = useState<TypeAudience | Vague | null>(null);
  const [formData, setFormData] = useState<Partial<FormModalData>>({});

  // Hooks pour les données
  const typesAudienceCRUD = useCRUDReferences('types_audience');
  const vaguesCRUD = useCRUDReferences(`vagues?typeAudienceId=${selectedType?.id || ''}`);

  // Rafraîchir les vagues quand un type est sélectionné
  useEffect(() => {
    if (selectedType) {
      vaguesCRUD.refresh();
    }
  }, [selectedType]);

  // Sélectionner le premier type par défaut
  useEffect(() => {
    if (!selectedType && typesAudienceCRUD.items.length > 0) {
      setSelectedType(typesAudienceCRUD.items[0] as TypeAudience);
    }
  }, [typesAudienceCRUD.items]);

  const handleOpenModal = (
    mode: 'type' | 'vague',
    item: TypeAudience | Vague | null = null
  ) => {
    setModalMode(mode);
    setEditingItem(item);
    setFormData({
      nom: item?.nom || '',
      annee: (item as Vague)?.annee || new Date().getFullYear(),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- MODIFICATION DE LA FONCTION handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const crud = modalMode === 'type' ? typesAudienceCRUD : vaguesCRUD;
    const payload = modalMode === 'vague'
        ? { ...formData, type_audience_id: selectedType?.id, annee: Number(formData.annee) }
        : { nom: formData.nom };

    let result: MutationResult;
    if (editingItem) {
      result = await crud.update(editingItem.id, payload);
    } else {
      result = await crud.create(payload);
    }
    
    if (result.success) {
      crud.refresh();
      handleCloseModal();
    } else {
      // Amélioration : on utilise le message d'erreur du hook s'il existe
      alert(result.message || 'Erreur lors de la sauvegarde.');
    }
  };
  
  // --- MODIFICATION DE LA FONCTION handleDelete ---
  const handleDelete = async (mode: 'type' | 'vague', id: number) => {
    const message = mode === 'type'
        ? "Attention, supprimer ce type supprimera également toutes les vagues et audiences associées. Confirmer ?"
        : "Êtes-vous sûr de vouloir supprimer cette vague ?";
        
    if (window.confirm(message)) {
      const crud = mode === 'type' ? typesAudienceCRUD : vaguesCRUD;
      const result: MutationResult = await crud.delete(id);
      
      if (result.success) {
        crud.refresh();
        if (mode === 'type' && selectedType?.id === id) {
          setSelectedType(null); // Déselectionner si le type actif est supprimé
        }
      } else {
        // Amélioration : on utilise le message d'erreur du hook s'il existe
        alert(result.message || 'Erreur lors de la suppression.');
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colonne 1: Types d'audience */}
        <div className="dashboard-card p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Types d'audience</h3>
            <button onClick={() => handleOpenModal('type')} className="btn-modern btn-secondary text-xs"><Plus className="w-4 h-4 mr-1"/>Ajouter</button>
          </div>
          {typesAudienceCRUD.loading && <p>Chargement...</p>}
          <ul className="space-y-2">
            {typesAudienceCRUD.items.map(item => (
              <li key={item.id} onClick={() => setSelectedType(item as TypeAudience)}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer ${selectedType?.id === item.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
              >
                <span className="font-medium">{item.nom}</span>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleOpenModal('type', item as TypeAudience);}} className="text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete('type', item.id);}} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 2: Vagues */}
        <div className={`dashboard-card p-4 ${!selectedType ? 'bg-gray-50' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg truncate">
              {selectedType ? `Vagues pour : ${selectedType.nom}` : "Sélectionnez un type"}
            </h3>
            {selectedType && <button onClick={() => handleOpenModal('vague')} className="btn-modern btn-secondary text-xs"><Plus className="w-4 h-4 mr-1"/>Ajouter</button>}
          </div>
          {selectedType ? (
            <>
              {vaguesCRUD.loading && <p>Chargement...</p>}
              <ul className="space-y-2">
                {vaguesCRUD.items.map(vague => (
                  <li key={vague.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100">
                    <span className="font-medium">{vague.nom} <span className="text-gray-400 text-sm">({(vague as Vague).annee})</span></span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenModal('vague', vague as Vague)} className="text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete('vague', vague.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-center text-gray-400 pt-10">
              <ArrowRight className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>Sélectionnez un type d'audience pour voir ses vagues.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modale générique */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">
              {editingItem ? 'Modifier' : 'Ajouter'} un{modalMode === 'type' ? ' type' : 'e vague'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium">Nom *</label>
                  <input type="text" name="nom" id="nom" value={formData.nom || ''} onChange={handleFormChange} required className="mt-1 block w-full border border-gray-300 rounded-md" />
                </div>
                {modalMode === 'vague' && (
                  <div>
                    <label htmlFor="annee" className="block text-sm font-medium">Année de référence</label>
                    <input type="number" name="annee" id="annee" value={formData.annee || ''} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md" />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="btn-modern btn-secondary">Annuler</button>
                <button type="submit" className="btn-modern btn-primary" disabled={typesAudienceCRUD.loading || vaguesCRUD.loading}>
                  {(typesAudienceCRUD.loading || vaguesCRUD.loading) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}