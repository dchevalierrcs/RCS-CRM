// frontend/src/app/parametres/produits/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { Plus, Edit, Trash2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// --- Types (mis à jour pour correspondre à la BDD) ---
interface Product {
  id: number;
  reference: string;
  name: string;
  product_type: 'MATERIEL' | 'FORMATION' | 'PRESTATION_SERVICE';
  unit_price_ht?: number | null;
  daily_rate_ht?: number | null;
  is_active: boolean;
}

// Le type pour le formulaire n'a pas besoin de 'id' ou 'is_active'
type ProductFormData = Omit<Product, 'id' | 'is_active'>;

// --- Composant du Formulaire (dans une Modale) ---
const ProductFormModal = ({ product, onSave, onCancel }: { product: Partial<Product> | null, onSave: (data: ProductFormData) => void, onCancel: () => void }) => {
  // Initialisation du state du formulaire
  const [formData, setFormData] = useState<ProductFormData>({
    reference: product?.reference || '',
    name: product?.name || '',
    product_type: product?.product_type || 'MATERIEL',
    unit_price_ht: product?.unit_price_ht || 0,
    daily_rate_ht: product?.daily_rate_ht || 0,
  });

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // S'assurer que les champs de prix sont bien des nombres
    const isNumberField = ['unit_price_ht', 'daily_rate_ht'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumberField ? (value ? parseFloat(value) : null) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          {/* En-tête de la modale */}
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold">{product?.id ? 'Modifier le produit' : 'Créer un produit'}</h3>
            <button type="button" onClick={onCancel} className="p-1 text-gray-500 hover:text-gray-800"><X/></button>
          </div>
          
          {/* Corps du formulaire */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reference" className="block text-sm font-bold text-gray-700">Référence</label>
                <input type="text" name="reference" value={formData.reference} onChange={handleChange} required className="mt-1 w-full px-3 py-2 border rounded-lg"/>
              </div>
              <div>
                <label htmlFor="product_type" className="block text-sm font-bold text-gray-700">Type</label>
                {/* Correction des options pour inclure FORMATION et PRESTATION_SERVICE */}
                <select name="product_type" value={formData.product_type} onChange={handleChange} required className="mt-1 w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="MATERIEL">Matériel</option>
                  <option value="FORMATION">Formation</option>
                  <option value="PRESTATION_SERVICE">Prestation de Service</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700">Nom du produit</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full px-3 py-2 border rounded-lg"/>
            </div>
            
            {/* Affichage conditionnel des champs de prix */}
            {formData.product_type === 'MATERIEL' && (
              <div>
                <label htmlFor="unit_price_ht" className="block text-sm font-bold text-gray-700">Prix Unitaire HT</label>
                <input type="number" step="0.01" name="unit_price_ht" value={formData.unit_price_ht || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-lg"/>
              </div>
            )}
            
            {(formData.product_type === 'FORMATION' || formData.product_type === 'PRESTATION_SERVICE') && (
              <div>
                <label htmlFor="daily_rate_ht" className="block text-sm font-bold text-gray-700">Taux Journalier HT</label>
                <input type="number" step="0.01" name="daily_rate_ht" value={formData.daily_rate_ht || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-lg"/>
              </div>
            )}
          </div>
          
          {/* Pied de la modale */}
          <div className="p-4 bg-gray-50 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="btn-modern btn-secondary">Annuler</button>
            <button type="submit" className="btn-modern btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Composant Principal de la Page ---
export default function ProductsSettingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const api = useApi();

  // Fonction pour récupérer les produits depuis l'API
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/products'); // L'API retourne un objet { success, data }
      setProducts(data);
    } catch (err: any) {
      setError("Impossible de charger le catalogue. " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Gère la sauvegarde (création ou mise à jour)
  const handleSave = async (data: ProductFormData) => {
    try {
      if (editingProduct?.id) {
        await api.put(`/products/${editingProduct.id}`, data);
      } else {
        await api.post('/products', data);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      await fetchProducts(); // Rafraîchir la liste
    } catch (err: any) {
      setError("Erreur lors de la sauvegarde : " + err.message);
    }
  };
  
  // Gère la suppression d'un produit
  const handleDelete = async (productId: number) => {
    // Remplacé window.confirm par une modale customisée si disponible
    if (confirm("Êtes-vous sûr de vouloir archiver ce produit ?")) {
      try {
        await api.del(`/products/${productId}`);
        await fetchProducts(); // Rafraîchir la liste
      } catch (err: any) {
        setError("Erreur lors de la suppression : " + err.message);
      }
    }
  };

  const openModal = (product: Partial<Product> | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      {isModalOpen && <ProductFormModal product={editingProduct} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />}
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/parametres" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2">
                <ArrowLeft className="w-4 h-4" />
                Retour aux paramètres
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Catalogue Produits</h1>
          </div>
          <button onClick={() => openModal()} className="btn-modern btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Produit
          </button>
        </div>
        
        {error && <p className="text-center text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {isLoading ? (
            <p className="text-center p-8">Chargement du catalogue...</p>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                    <tr>
                    <th className="p-3">Référence</th>
                    <th className="p-3">Nom</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Prix HT</th>
                    <th className="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-gray-600">{p.reference}</td>
                        <td className="p-3 font-semibold">{p.name}</td>
                        <td className="p-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{p.product_type.replace('_', ' ')}</span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {/* Logique d'affichage des prix corrigée */}
                          {p.product_type === 'MATERIEL' && p.unit_price_ht && `${p.unit_price_ht?.toFixed(2)} €/u`}
                          {(p.product_type === 'FORMATION' || p.product_type === 'PRESTATION_SERVICE') && p.daily_rate_ht && `${p.daily_rate_ht?.toFixed(2)} €/j`}
                        </td>
                        <td className="p-3 flex justify-center gap-2">
                        <button onClick={() => openModal(p)} className="btn-icon btn-secondary"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(p.id)} className="btn-icon btn-danger"><Trash2 className="w-4 h-4"/></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
