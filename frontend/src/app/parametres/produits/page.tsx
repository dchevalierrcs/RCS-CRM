'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';
import { Plus, Edit, Archive, ArchiveRestore, Loader2, Search, X, Copy, AlertTriangle } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';
import NotificationModal from '@/components/NotificationModal';

// --- Types ---
interface Product {
  id: number;
  reference: string;
  name: string;
  name_en?: string;
  internal_label?: string;
  description?: string;
  description_en?: string;
  product_type: 'MATERIEL' | 'FORMATION' | 'PRESTATION_SERVICE' | 'ADDON';
  unit_price_ht?: number | null;
  daily_rate_ht?: number | null;
  is_active: boolean;
  is_addon: boolean;
  addon_rule?: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  addon_value?: number | null;
  addon_basis_logiciel_id?: number | null;
  addon_basis_service_id?: number | null;
}
interface Logiciel { id: number; nom: string; }
interface Service { id: number; nom: string; }

// --- Composants ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, loading, title, message }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                            <div className="mt-2"><p className="text-sm text-gray-500">{message}</p></div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button type="button" onClick={onConfirm} disabled={loading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-red-300">
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmer'}
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProductFormModal = ({ product, onSave, onCancel, error, logiciels, services }: { product: Partial<Product> | null, onSave: (data: any) => void, onCancel: () => void, error: string | null, logiciels: Logiciel[], services: Service[] }) => {
    
    const getInitialFormData = (p: Partial<Product> | null): Partial<Product> => {
        const defaults: Partial<Product> = {
            reference: '',
            name: '',
            product_type: 'MATERIEL',
            is_active: true,
            unit_price_ht: null,
            daily_rate_ht: null,
            is_addon: false,
            addon_rule: null,
            addon_value: null,
            addon_basis_logiciel_id: null,
            addon_basis_service_id: null,
        };
        return { ...defaults, ...(p || {}) };
    };

    const [formData, setFormData] = useState<Partial<Product>>(getInitialFormData(product));

    useEffect(() => {
        setFormData(getInitialFormData(product));
    }, [product]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
            const numValue = value === '' ? null : parseFloat(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{formData.id ? 'Modifier' : 'Créer'} un Produit</h2>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200"><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Référence*</label>
                            <input type="text" name="reference" value={formData.reference || ''} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom du produit*</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="product_type" className="block text-sm font-medium text-gray-700">Type de produit*</label>
                        <select name="product_type" value={formData.product_type} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="MATERIEL">Matériel</option>
                            <option value="FORMATION">Formation</option>
                            <option value="PRESTATION_SERVICE">Prestation de service</option>
                            <option value="ADDON">Add-on (Abonnement)</option>
                        </select>
                    </div>

                    {formData.product_type === 'MATERIEL' && (
                        <div>
                            <label htmlFor="unit_price_ht" className="block text-sm font-medium text-gray-700">Prix unitaire HT</label>
                            <input type="number" step="0.01" name="unit_price_ht" value={formData.unit_price_ht || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    )}
                    {(formData.product_type === 'FORMATION' || formData.product_type === 'PRESTATION_SERVICE') && (
                        <div>
                            <label htmlFor="daily_rate_ht" className="block text-sm font-medium text-gray-700">Taux journalier HT</label>
                            <input type="number" step="0.01" name="daily_rate_ht" value={formData.daily_rate_ht || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    )}
                    {formData.product_type === 'ADDON' && (
                        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 space-y-4">
                            <h3 className="font-semibold text-blue-800">Paramètres de l'Add-on</h3>
                             <div>
                                <label htmlFor="addon_rule" className="block text-sm font-medium text-gray-700">Règle de calcul</label>
                                <select name="addon_rule" value={formData.addon_rule || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    <option value="">Sélectionner une règle</option>
                                    <option value="FIXED_AMOUNT">Montant fixe mensuel</option>
                                    <option value="PERCENTAGE">Pourcentage sur un autre item</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="addon_value" className="block text-sm font-medium text-gray-700">Valeur</label>
                                <input type="number" step="0.01" name="addon_value" value={formData.addon_value || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder={formData.addon_rule === 'PERCENTAGE' ? '% Ex: 10' : '€ Ex: 150'}/>
                            </div>
                            {formData.addon_rule === 'PERCENTAGE' && (
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="addon_basis_logiciel_id" className="block text-sm font-medium text-gray-700">Basé sur le logiciel</label>
                                        <select name="addon_basis_logiciel_id" value={formData.addon_basis_logiciel_id || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                            <option value="">Aucun</option>
                                            {logiciels.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="addon_basis_service_id" className="block text-sm font-medium text-gray-700">Basé sur le service</label>
                                        <select name="addon_basis_service_id" value={formData.addon_basis_service_id || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                            <option value="">Aucun</option>
                                            {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </form>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Annuler</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sauvegarder</button>
                </div>
            </div>
        </div>
    );
};


export default function ProductsPage() {
    const api = useApi();
    const [products, setProducts] = useState<Product[]>([]);
    const [logiciels, setLogiciels] = useState<Logiciel[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Product> | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ show: boolean, type: 'success' | 'error', message: string } | null>(null);
    const [itemToToggle, setItemToToggle] = useState<Product | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/products?search=${debouncedSearchTerm}`);
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); setProducts([]); }
        finally { setLoading(false); }
    }, [api, debouncedSearchTerm]);

    const fetchDropdownData = useCallback(async () => {
        try {
            const [logicielsRes, servicesRes] = await Promise.all([
                api.get('/logiciels'),
                api.get('/services')
            ]);
            setLogiciels(logicielsRes.data || []);
            setServices(servicesRes.data || []);
        } catch (error) {
            console.error("Erreur chargement listes pour add-ons:", error);
        }
    }, [api]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    const openModal = (item: Partial<Product> | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
        setModalError(null);
    };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };

    const handleSubmit = async (data: any) => {
        try {
            const payload = { ...data };
            if (payload.product_type !== 'MATERIEL') payload.unit_price_ht = null;
            if (payload.product_type !== 'FORMATION' && payload.product_type !== 'PRESTATION_SERVICE') payload.daily_rate_ht = null;
            if (payload.product_type !== 'ADDON') {
                payload.addon_rule = null;
                payload.addon_value = null;
                payload.addon_basis_logiciel_id = null;
                payload.addon_basis_service_id = null;
            }

            if (payload.id) {
                await api.put(`/products/${payload.id}`, { ...payload, is_active: editingItem?.is_active });
                setNotification({ show: true, type: 'success', message: 'Produit mis à jour.' });
            } else {
                await api.post('/products', payload);
                setNotification({ show: true, type: 'success', message: 'Produit créé.' });
            }
            handleCloseModal();
            fetchProducts();
        } catch (err: any) { setModalError(err.message || 'Une erreur est survenue.'); }
    };

    const handleDuplicate = async (productId: number) => {
        try {
            // 1. Obtenir les données du produit dupliqué
            const { data: newProduct } = await api.post(`/products/${productId}/duplicate`, {});
            setNotification({ show: true, type: 'success', message: `Produit dupliqué avec succès.` });
            
            // 2. Ouvrir la modale IMMÉDIATEMENT avec les nouvelles données
            openModal(newProduct);

            // 3. Rafraîchir la liste en arrière-plan
            fetchProducts();
        } catch (err: any) {
            console.error("Erreur duplication:", err);
            setNotification({ show: true, type: 'error', message: err.message || 'Erreur lors de la duplication.' });
        }
    };

    const handleToggleActiveRequest = (item: Product) => { setItemToToggle(item); setIsConfirmOpen(true); };

    const confirmToggleActive = async () => {
        if (!itemToToggle) return;
        try {
            await api.del(`/products/${itemToToggle.id}`);
            setNotification({ show: true, type: 'success', message: `Statut de "${itemToToggle.name}" mis à jour.` });
            fetchProducts();
        } catch (err: any) { setNotification({ show: true, type: 'error', message: err.message || 'Erreur.' }); }
        finally { setIsConfirmOpen(false); setItemToToggle(null); }
    };
    
    const productTypesMap: { [key: string]: string } = {
        MATERIEL: 'Matériel',
        FORMATION: 'Formation',
        PRESTATION_SERVICE: 'Prestation',
        ADDON: 'Add-on'
    };
    
    return (
        <div className="p-6">
            {notification?.show && <NotificationModal 
                type={notification.type === 'success' ? 'info' : 'warning'} 
                title={notification.type === 'success' ? 'Succès' : 'Erreur'}
                message={notification.message} 
                onClose={() => setNotification(null)} 
            />}
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmToggleActive} title={`${itemToToggle?.is_active ? 'Archiver' : 'Restaurer'} le produit`} message={`Êtes-vous sûr de vouloir ${itemToToggle?.is_active ? 'archiver' : 'restaurer'} le produit "${itemToToggle?.name}" ?`} />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Catalogue des Produits & Prestations</h1>
                <button onClick={() => openModal()} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" />Nouveau Produit</button>
            </div>
            
             <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="Rechercher par référence, nom..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-sm pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border">
                <div className="overflow-x-auto">
                    {loading ? (<div className="p-10 text-center"><Loader2 className="animate-spin inline-block w-6 h-6" /></div>) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">Référence</th>
                                <th className="p-3 text-left font-semibold text-gray-600">Nom</th>
                                <th className="p-3 text-left font-semibold text-gray-600">Type</th>
                                <th className="p-3 text-center font-semibold text-gray-600">Statut</th>
                                <th className="p-3 text-center font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {products.map(p => (
                            <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? 'bg-gray-100 text-gray-500' : ''}`}>
                                <td className="p-3 font-mono text-xs">{p.reference}</td>
                                <td className="p-3 font-semibold">{p.name}</td>
                                <td className="p-3">{productTypesMap[p.product_type] || p.product_type}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.is_active ? 'Actif' : 'Archivé'}</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => handleDuplicate(p.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Dupliquer"><Copy className="w-4 h-4" /></button>
                                        <button onClick={() => openModal(p)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Modifier"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleToggleActiveRequest(p)} className={`p-2 rounded-full ${!p.is_active ? 'text-green-600 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'}`} title={p.is_active ? 'Archiver' : 'Restaurer'}>
                                            {p.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
            {isModalOpen && <ProductFormModal 
                key={editingItem ? editingItem.id : 'new'} 
                product={editingItem} 
                onCancel={handleCloseModal} 
                onSave={handleSubmit} 
                error={modalError} 
                logiciels={logiciels} 
                services={services} 
            />}
        </div>
    );
}

