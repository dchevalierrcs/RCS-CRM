'use client';

import { useEffect, useState } from 'react';
import { 
  Monitor, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Package, 
  Settings,
  Radio,
  Calendar,
  Layers,
  Globe,
  Building2
} from 'lucide-react';
import { useCRUDReferences } from '@/hooks/useCRUDReferences';

type Logiciel = {
  id?: number;
  nom: string;
  type_logiciel: string;
  description?: string;
  editeur: string;
  actif?: boolean;
};

const types = [
  { 
    value: 'programmation', 
    label: 'Programmation',
    icon: Calendar,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    description: 'Logiciels de programmation musicale'
  },
  { 
    value: 'diffusion', 
    label: 'Diffusion',
    icon: Radio,
    color: 'bg-green-50 text-green-600 border-green-200',
    description: 'Logiciels de diffusion en direct'
  },
  { 
    value: 'planification', 
    label: 'Planification',
    icon: Layers,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    description: 'Outils de planification et organisation'
  },
  { 
    value: 'streaming', 
    label: 'Streaming',
    icon: Globe,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    description: 'Services et serveurs de streaming'
  }
];

export default function LogicielsPage() {
  const { items, loading, error, create, update, delete: remove, refresh } = useCRUDReferences('logiciels');
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Logiciel | null>(null);
  const [form, setForm] = useState({
    nom: '',
    type_logiciel: '',
    description: '',
    editeur: ''
  });

  useEffect(() => {
    refresh();
  }, []);

  // Filtrer les logiciels par type actif
  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter((item: Logiciel) => item.type_logiciel === activeTab);

  // Statistiques par type
  const statsByType = types.map(type => ({
    ...type,
    count: items.filter((item: Logiciel) => item.type_logiciel === type.value).length
  }));

  // Grouper par éditeur pour affichage
  const itemsByEditor = filteredItems.reduce((acc: any, item: Logiciel) => {
    const editor = item.editeur || 'Non spécifié';
    if (!acc[editor]) {
      acc[editor] = [];
    }
    acc[editor].push(item);
    return acc;
  }, {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing) {
        await update(editing.id!, form);
        setEditing(null);
      } else {
        await create(form);
      }
      
      setForm({ nom: '', type_logiciel: '', description: '', editeur: '' });
      setShowModal(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  const handleEdit = (logiciel: Logiciel) => {
    setForm({
      nom: logiciel.nom,
      type_logiciel: logiciel.type_logiciel,
      description: logiciel.description || '',
      editeur: logiciel.editeur || ''
    });
    setEditing(logiciel);
    setShowModal(true);
  };

  const handleDelete = async (logiciel: Logiciel) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${logiciel.nom}" ?`)) {
      await remove(logiciel.id!);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ nom: '', type_logiciel: '', description: '', editeur: '' });
  };

  const openNewModal = (type?: string) => {
    setEditing(null);
    setForm({ 
      nom: '', 
      type_logiciel: type || '', 
      description: '',
      editeur: ''
    });
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
          <span className="text-gray-900">Logiciels & Produits</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Catalogue Logiciels Radio
              </h1>
            </div>
            <p className="text-gray-600">
              Gérez votre catalogue de logiciels par catégorie et éditeur
            </p>
          </div>
          
          <button
            onClick={() => openNewModal()}
            className="btn-modern btn-primary"
          >
            <Plus className="w-4 h-4" />
            Nouveau logiciel
          </button>
        </div>
      </div>

      {/* Statistiques par type */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        {statsByType.map((type) => {
          const IconComponent = type.icon;
          return (
            <div key={type.value} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{type.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{type.count}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${type.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Onglets de filtrage */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tous les logiciels ({items.length})
            </button>
            
            {types.map((type) => {
              const count = statsByType.find(s => s.value === type.value)?.count || 0;
              return (
                <button
                  key={type.value}
                  onClick={() => setActiveTab(type.value)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === type.value
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.label} ({count})
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Actions rapides par type */}
      {activeTab !== 'all' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {types.find(t => t.value === activeTab)?.label}
              </h3>
              <p className="text-sm text-blue-700">
                {types.find(t => t.value === activeTab)?.description}
              </p>
            </div>
            <button
              onClick={() => openNewModal(activeTab)}
              className="btn-modern btn-primary"
            >
              <Plus className="w-4 h-4" />
              Ajouter un {types.find(t => t.value === activeTab)?.label.toLowerCase()}
            </button>
          </div>
        </div>
      )}

      {/* Messages d'erreur/chargement */}
      {error && (
        <div className="dashboard-card mb-6">
          <div className="text-red-600 text-center py-4">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Table des logiciels avec colonne éditeur */}
      <div className="dashboard-card">
        {loading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'all' ? 'Aucun logiciel configuré' : `Aucun logiciel de ${types.find(t => t.value === activeTab)?.label.toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-4">
              Commencez par ajouter des logiciels à votre catalogue
            </p>
            <button
              onClick={() => openNewModal(activeTab !== 'all' ? activeTab : undefined)}
              className="btn-modern btn-primary"
            >
              <Plus className="w-4 h-4" />
              Ajouter un logiciel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logiciel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Éditeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((logiciel: Logiciel) => {
                  const typeInfo = types.find(t => t.value === logiciel.type_logiciel);
                  const IconComponent = typeInfo?.icon || Monitor;
                  
                  return (
                    <tr key={logiciel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 border ${typeInfo?.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {logiciel.nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                            <Building2 className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="text-sm text-gray-900 font-medium">
                            {logiciel.editeur || 'Non spécifié'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeInfo?.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {typeInfo?.label || logiciel.type_logiciel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {logiciel.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(logiciel)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(logiciel)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'ajout/modification avec champ éditeur */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Modifier le logiciel' : 'Nouveau logiciel'}
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
                  Nom du logiciel *
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: GSelector, WinMedia..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Éditeur *
                </label>
                <input
                  type="text"
                  value={form.editeur}
                  onChange={(e) => setForm({ ...form, editeur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: RCS, Dinesat, Microsoft..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de logiciel *
                </label>
                <select
                  value={form.type_logiciel}
                  onChange={(e) => setForm({ ...form, type_logiciel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  {types.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description du logiciel (optionnel)"
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
