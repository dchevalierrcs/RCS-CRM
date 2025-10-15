'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { Plus, Edit, Archive, ArchiveRestore, Loader2, Search, Copy, AlertTriangle } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';
import NotificationModal from '@/components/NotificationModal';

// --- Types ---
interface Service {
  id: number;
  nom: string;
  name_en?: string;
  categorie?: string;
  permet_plusieurs_instances: boolean;
  editeur_id?: number | null;
  actif: boolean;
}

interface Editeur {
  id: number;
  nom: string;
}

// --- Composants ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, loading, title, message }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">{message}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button type="button" onClick={onConfirm} disabled={loading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:bg-red-300">
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmer'}
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

const ServiceFormModal = ({ service, editeurs, onSave, onCancel, error }: { service: Partial<Service> | null, editeurs: Editeur[], onSave: (data: any) => void, onCancel: () => void, error: string | null }) => {
    const [formData, setFormData] = useState<Partial<Service>>({
        nom: '', name_en: '', categorie: '', permet_plusieurs_instances: false, editeur_id: null, ...service
    });

    useEffect(() => {
        setFormData({ nom: '', name_en: '', categorie: '', permet_plusieurs_instances: false, editeur_id: null, ...service });
    }, [service]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{formData.id ? 'Modifier' : 'Créer'} un Service</h2>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200">X</button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>}
                    <div>
                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom du service*</label>
                        <input type="text" name="nom" value={formData.nom} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="name_en" className="block text-sm font-medium text-gray-700">Nom du service (Anglais)</label>
                        <input type="text" name="name_en" value={formData.name_en || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="categorie" className="block text-sm font-medium text-gray-700">Catégorie</label>
                            <input type="text" name="categorie" value={formData.categorie || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="editeur_id" className="block text-sm font-medium text-gray-700">Éditeur</label>
                            <select name="editeur_id" value={formData.editeur_id || ''} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                <option value="">Aucun</option>
                                {editeurs.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="permet_plusieurs_instances" name="permet_plusieurs_instances" checked={!!formData.permet_plusieurs_instances} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                        <label htmlFor="permet_plusieurs_instances" className="ml-2 block text-sm text-gray-900">Permettre plusieurs instances de ce service pour un même client</label>
                    </div>
                </form>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Annuler</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sauvegarder</button>
                </div>
            </div>
        </div>
    );
};

export default function ServicesPage() {
    const api = useApi();
    const [services, setServices] = useState<Service[]>([]);
    const [editeurs, setEditeurs] = useState<Editeur[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Service> | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ show: boolean, type: 'success' | 'error', message: string } | null>(null);
    const [itemToToggle, setItemToToggle] = useState<Service | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/services');
            setServices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err); setServices([]);
        } finally {
            setLoading(false);
        }
    }, [api]);

    const fetchEditeurs = useCallback(async () => {
        try {
            const { data } = await api.get('/editeurs');
            setEditeurs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    }, [api]);

    useEffect(() => {
        fetchServices();
        fetchEditeurs();
    }, [fetchServices, fetchEditeurs]);

    const openModal = (item: Partial<Service> | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
        setModalError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = async (data: any) => {
        const payload = { ...data, editeur_id: data.editeur_id || null };
        try {
            if (payload.id) {
                await api.put(`/services/${payload.id}`, payload);
                setNotification({ show: true, type: 'success', message: 'Service mis à jour.' });
            } else {
                await api.post('/services', payload);
                setNotification({ show: true, type: 'success', message: 'Service créé.' });
            }
            handleCloseModal();
            fetchServices();
        } catch (err: any) {
            setModalError(err.message || 'Une erreur est survenue.');
        }
    };
    
    const handleDuplicate = async (serviceId: number) => {
        try {
            const { data: newService } = await api.post(`/services/${serviceId}/duplicate`, {});
            setNotification({ show: true, type: 'success', message: `Service dupliqué avec succès.` });
            await fetchServices();
            openModal(newService); // Ouvre la modale d'édition pour la nouvelle copie
        } catch (err: any) {
            console.error("Erreur lors de la duplication:", err);
            setNotification({ show: true, type: 'error', message: err.message || 'Erreur lors de la duplication.' });
        }
    };

    const handleToggleActiveRequest = (item: Service) => {
        setItemToToggle(item);
        setIsConfirmOpen(true);
    };

    const confirmToggleActive = async () => {
        if (!itemToToggle) return;
        try {
            await api.del(`/services/${itemToToggle.id}`);
            setNotification({ show: true, type: 'success', message: `Statut de "${itemToToggle.nom}" mis à jour.` });
            fetchServices();
        } catch (err: any) {
            setNotification({ show: true, type: 'error', message: err.message || 'Erreur.' });
        } finally {
            setIsConfirmOpen(false);
            setItemToToggle(null);
        }
    };

    return (
        <div className="p-6">
            {notification?.show && (
                <NotificationModal
                    type={notification.type === 'success' ? 'info' : 'warning'}
                    title={notification.type === 'success' ? 'Opération réussie' : 'Erreur'}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}
             <ConfirmationModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmToggleActive}
                loading={false}
                title={`${itemToToggle?.actif ? 'Archiver' : 'Restaurer'} le service`}
                message={`Êtes-vous sûr de vouloir ${itemToToggle?.actif ? 'archiver' : 'restaurer'} le service "${itemToToggle?.nom}" ?`}
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Catalogue des Services</h1>
                <button onClick={() => openModal()} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4" />Nouveau Service</button>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg border">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-10 text-center"><Loader2 className="animate-spin inline-block w-6 h-6" /></div>
                    ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">Nom</th>
                                <th className="p-3 text-left font-semibold text-gray-600">Catégorie</th>
                                <th className="p-3 text-center font-semibold text-gray-600">Statut</th>
                                <th className="p-3 text-center font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {services.map(s => (
                            <tr key={s.id} className={`hover:bg-gray-50 ${!s.actif ? 'bg-gray-100 text-gray-500' : ''}`}>
                                <td className="p-3 font-semibold">{s.nom}</td>
                                <td className="p-3">{s.categorie}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {s.actif ? 'Actif' : 'Archivé'}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => handleDuplicate(s.id)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Dupliquer"><Copy className="w-4 h-4" /></button>
                                        <button onClick={() => openModal(s)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Modifier"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleToggleActiveRequest(s)} className={`p-2 rounded-full transition-colors ${!s.actif ? 'text-green-600 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'}`} title={s.actif ? 'Archiver' : 'Restaurer'}>
                                            {s.actif ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
            {isModalOpen && <ServiceFormModal service={editingItem} editeurs={editeurs} onCancel={handleCloseModal} onSave={handleSubmit} error={modalError} />}
        </div>
    );
}