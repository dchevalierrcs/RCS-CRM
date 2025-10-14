'use client';

import { useEffect, useState } from 'react';
import { 
  Radio, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Settings,
  Wifi
} from 'lucide-react';
import { useCRUDReferences } from '@/hooks/useCRUDReferences';

type TypeDiffusion = {
  id?: number;
  code: string;
  libelle: string;
  actif?: boolean;
};

export default function TypesDiffusionPage() {
  const { items, loading, error, create, update, delete: remove, refresh } = useCRUDReferences('types-diffusion');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TypeDiffusion | null>(null);
  const [form, setForm] = useState({
    code: '',
    libelle: ''
  });

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing) {
        await update(editing.id!, form);
        setEditing(null);
      } else {
        await create(form);
      }
      
      setForm({ code: '', libelle: '' });
      setShowModal(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  const handleEdit = (type: TypeDiffusion) => {
    setForm({
      code: type.code,
      libelle: type.libelle
    });
    setEditing(type);
    setShowModal(true);
  };

  const handleDelete = async (type: TypeDiffusion) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${type.libelle}" ?`)) {
      await remove(type.id!);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ code: '', libelle: '' });
  };

  const openModal = () => {
    setEditing(null);
    setForm({ code: '', libelle: '' });
    setShowModal(true);
  };

  return (
    <div className="p-8">
      {/* Header avec breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Settings className="w-4 h-4" />
          <span>Paramètres</span>
          <span>/</span>
          <span className="text-gray-900">Types de Diffusion</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Radio className="w-5 h-5 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Types de Diffusion
              </h1>
            </div>
            <p className="text-gray-600">
              Gérez les différents modes de diffusion de vos stations radio
            </p>
          </div>
          
          <button
            onClick={openModal}
            className="btn-modern btn-primary"
          >
            <Plus className="w-4 h-4" />
            Nouveau type
          </button>
        </div>
      </div>

      {/* Statistique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Types</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="dashboard-card mb-6">
          <div className="text-red-600 text-center py-4">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Liste des types */}
      <div className="dashboard-card">
        {loading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun type de diffusion configuré
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par ajouter vos premiers types de diffusion
            </p>
            <button
              onClick={openModal}
              className="btn-modern btn-primary"
            >
              <Plus className="w-4 h-4" />
              Ajouter un type
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type de Diffusion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((type: TypeDiffusion) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {type.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 border border-indigo-200">
                          <Wifi className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {type.libelle}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Modifier le type de diffusion' : 'Nouveau type de diffusion'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: FM, DAB+, IP..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libellé *
                </label>
                <input
                  type="text"
                  value={form.libelle}
                  onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: FM, DAB+, IP/Streaming..."
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-modern btn-primary flex-1">
                  <Save className="w-4 h-4" />
                  {editing ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-modern btn-secondary flex-1"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
