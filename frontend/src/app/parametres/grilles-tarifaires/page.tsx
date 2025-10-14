// frontend/src/app/parametres/grilles-tarifaires/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Archive, ArchiveRestore, Loader2, ArrowUp, ArrowDown, AlertCircle, AlertTriangle, X, ListTree, Copy } from 'lucide-react';

// --- Interfaces et Types ---
interface Tarif {
  id: number;
  logiciel_id: number;
  logiciel_nom: string;
  nom: string;
  reference: string;
  description?: string;
  description_en?: string;
  audience_min?: number | null;
  audience_max?: number | null;
  prix_mensuel_ht: number | string;
  is_active: boolean;
}

interface Logiciel {
  id: number;
  nom: string;
}

// --- Hooks ---
const useApi = () => {
    const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const url = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const headers = new Headers(options.headers || {});
        if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }
        const config: RequestInit = { ...options, headers, credentials: 'include' };
        try {
            const response = await fetch(url, config);
            if (response.status === 401) { window.location.href = '/login'; throw new Error('Session expirée.'); }
            const responseText = await response.text();
            const responseBody = responseText ? JSON.parse(responseText) : null;
            if (!response.ok) { throw new Error(responseBody?.message || 'Erreur API.'); }
            return responseBody?.data !== undefined ? responseBody.data : responseBody;
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }, []);
    return useMemo(() => ({
        get: <T,>(endpoint: string): Promise<T> => request(endpoint),
        post: <T,>(endpoint: string, body: any): Promise<T> => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
        put: <T,>(endpoint: string, body: any): Promise<T> => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
        del: <T,>(endpoint: string): Promise<T> => request(endpoint, { method: 'DELETE' }),
    }), [request]);
};

// --- Composants ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, loading }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; loading: boolean; }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md"><div className="p-6"><div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3><div className="mt-2"><p className="text-sm text-gray-500">{message}</p></div></div></div></div><div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><button type="button" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 w-full sm:ml-3 sm:w-auto" onClick={onConfirm} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirmer'}</button><button type="button" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-indigo-500 mt-3 w-full sm:mt-0 sm:w-auto" onClick={onClose}>Annuler</button></div></div>
        </div>
    );
};

const TarifFormModal = ({ item, onClose, onSubmit, logiciels, error }: { item: Partial<Tarif> | null; onClose: () => void; onSubmit: (data: Partial<Tarif>) => void; logiciels: Logiciel[]; error: string | null; }) => {
    const [formData, setFormData] = useState<Partial<Tarif>>(item || { is_active: true });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };
    const inputStyle = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{item?.id ? 'Modifier le Tarif' : 'Créer un Tarif'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><X /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center"><AlertCircle className="w-5 h-5 mr-2" />{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label>Logiciel RCS*</label><select name="logiciel_id" value={formData.logiciel_id || ''} onChange={handleChange} required className={inputStyle}><option value="">Sélectionner...</option>{logiciels.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}</select></div>
                            <div><label>Référence*</label><input type="text" name="reference" value={formData.reference || ''} onChange={handleChange} required className={inputStyle}/></div>
                        </div>
                        <div><label>Nom du tarif*</label><input type="text" name="nom" value={formData.nom || ''} onChange={handleChange} required className={inputStyle}/></div>
                        <div><label>Description (pour devis)</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2} className={inputStyle} placeholder="Description en français..."></textarea></div>
                        <div><label>Description (EN)</label><textarea name="description_en" value={formData.description_en || ''} onChange={handleChange} rows={2} className={inputStyle} placeholder="Description en anglais..."></textarea></div>

                        <div className="p-4 border rounded-lg bg-slate-50/70">
                            <h4 className="text-md font-semibold text-gray-700 mb-3">Paliers d'audience (optionnel)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Audience Min</label><input type="number" name="audience_min" value={formData.audience_min || ''} onChange={handleChange} placeholder="Laisser vide si tarif fixe" className={inputStyle}/></div>
                                <div><label>Audience Max</label><input type="number" name="audience_max" value={formData.audience_max || ''} onChange={handleChange} placeholder="Laisser vide si tarif fixe" className={inputStyle}/></div>
                            </div>
                        </div>
                        <div><label>Prix Mensuel HT (€)*</label><input type="number" step="0.01" name="prix_mensuel_ht" value={formData.prix_mensuel_ht || ''} onChange={handleChange} required className={inputStyle}/></div>
                        {item?.id && <div className="flex items-center pt-2"><input type="checkbox" name="is_active" id="is_active" checked={!!formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300"/><label htmlFor="is_active" className="ml-2 block text-sm">Tarif Actif</label></div>}
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t"><button type="button" onClick={onClose} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-indigo-500">Annuler</button><button type="submit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Enregistrer</button></div>
                </form>
            </div>
        </div>
    );
};

export default function GrillesTarifairesPage() {
    const [tarifs, setTarifs] = useState<Tarif[]>([]);
    const [logiciels, setLogiciels] = useState<Logiciel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Tarif> | null>(null);
    const [modalError, setModalError] = useState<string|null>(null);
    const [sortConfig, setSortConfig] = useState<{key: keyof Tarif, direction: 'ascending'|'descending'}>({ key: 'logiciel_nom', direction: 'ascending' });
    const [itemToToggle, setItemToToggle] = useState<Tarif | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [activeSoftwareId, setActiveSoftwareId] = useState<number | 'all'>('all');

    const api = useApi();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tarifsData, logicielsData] = await Promise.all([
                api.get<Tarif[]>('/tarifs'),
                api.get<Logiciel[]>('/tarifs/rcs-logiciels')
            ]);
            setTarifs(tarifsData);
            setLogiciels(logicielsData);
        } catch (err) {
            setError('Erreur lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (item: Partial<Tarif> | null = null) => { setModalError(null); setEditingItem(item); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };

    const handleDuplicate = (itemToDuplicate: Tarif) => {
        const { id, ...newItemData } = itemToDuplicate;
        newItemData.reference = `${newItemData.reference}_COPIE`;
        newItemData.nom = `${newItemData.nom} (Copie)`;
        handleOpenModal(newItemData);
    };

    const handleSubmit = async (data: Partial<Tarif>) => {
        setModalError(null);
        try {
            if (editingItem?.id) {
                await api.put(`/tarifs/${editingItem.id}`, data);
            } else {
                await api.post('/tarifs', data);
            }
            await fetchData();
            handleCloseModal();
        } catch(err: any) {
            setModalError(err.message || "Une erreur est survenue.");
        }
    };

    const handleToggleActiveRequest = (item: Tarif) => { setItemToToggle(item); setIsConfirmOpen(true); };
    
    const confirmToggleActive = async () => {
        if (!itemToToggle) return;
        try {
            await api.del(`/tarifs/${itemToToggle.id}`);
            await fetchData();
        } catch (err: any) {
            setError(err.message || 'Erreur lors du changement de statut.');
        } finally {
            setIsConfirmOpen(false);
            setItemToToggle(null);
        }
    };

    const handleSort = (key: keyof Tarif) => setSortConfig(p => ({ key, direction: p.key === key && p.direction === 'ascending' ? 'descending' : 'ascending' }));
    
    const softwareWithTarifs = useMemo(() => {
        const softwareMap = new Map<number, string>();
        tarifs.forEach(tarif => {
            if (!softwareMap.has(tarif.logiciel_id)) {
                softwareMap.set(tarif.logiciel_id, tarif.logiciel_nom);
            }
        });
        const sorted = Array.from(softwareMap.entries()).map(([id, nom]) => ({ id, nom })).sort((a,b) => a.nom.localeCompare(b.nom));
        return [{ id: 'all', nom: 'Tous' }, ...sorted];
    }, [tarifs]);

    const sortedTarifs = useMemo(() => {
        const filteredTarifs = activeSoftwareId === 'all' 
            ? [...tarifs] 
            : tarifs.filter(t => t.logiciel_id === activeSoftwareId);

        return filteredTarifs.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [tarifs, sortConfig, activeSoftwareId]);

    const renderSortArrow = (key: keyof Tarif) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 text-slate-400"/> : <ArrowDown className="h-3 w-3 text-slate-400"/>;
    };
    
    const renderTableHeader = (key: keyof Tarif, label: string) => (
        <th scope="col" className="px-6 py-3"><button onClick={() => handleSort(key)} className="flex items-center gap-1.5 group"><span className="font-semibold">{label}</span><span className="opacity-0 group-hover:opacity-100 transition-opacity">{renderSortArrow(key)}</span></button></th>
    );

    return (
        <div className="p-6 md:p-8">
            <div className="mb-8"><h1 className="text-3xl font-bold text-slate-900">Grilles Tarifaires Logiciels</h1><p className="text-slate-600 mt-1">Gérez les tarifs des logiciels édités par RCS.</p></div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 flex justify-between items-center border-b border-slate-200"><h2 className="text-lg font-semibold text-slate-800">Tarifs Actuels</h2><button onClick={() => handleOpenModal()} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><Plus className="w-4 h-4" />Ajouter un tarif</button></div>
                
                {softwareWithTarifs.length > 1 && (
                    <div className="flex items-center text-sm space-x-1 border-b border-slate-200 px-4">
                        {softwareWithTarifs.map((software) => (
                            <button key={software.id} onClick={() => setActiveSoftwareId(software.id as number | 'all')} className={`px-3 py-2 -mb-px border-b-2 ${activeSoftwareId === software.id ? 'border-blue-500 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                {software.nom}
                            </button>
                        ))}
                    </div>
                )}

                <div className="overflow-x-auto">
                    {loading ? <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div> : error ? <div className="p-6 text-red-600 bg-red-50">{error}</div> : (
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50"><tr>{renderTableHeader('logiciel_nom', 'Logiciel')}{renderTableHeader('reference', 'Référence')}{renderTableHeader('nom', 'Nom du Tarif')}<th className="px-6 py-3 font-semibold uppercase tracking-wider">Paliers Audience</th>{renderTableHeader('prix_mensuel_ht', 'Prix Mensuel HT')}{renderTableHeader('is_active', 'Statut')}<th className="px-6 py-3 text-right font-semibold uppercase tracking-wider">Actions</th></tr></thead>
                        <tbody className="divide-y divide-slate-200">
                            {sortedTarifs.map((item) => (
                            <tr key={item.id} className={`bg-white hover:bg-slate-50 ${!item.is_active ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 font-medium text-slate-900">{item.logiciel_nom}</td>
                                <td className="px-6 py-4 text-xs text-slate-800">{item.reference}</td>
                                <td className="px-6 py-4 text-slate-800">{item.nom}</td>
                                <td className="px-6 py-4">{item.audience_min || item.audience_max ? `${item.audience_min || '...'} - ${item.audience_max || '...'}` : 'Prix Fixe'}</td>
                                <td className="px-6 py-4 text-slate-800">{Number(item.prix_mensuel_ht).toFixed(2)}€</td>
                                <td className="px-6 py-4"><span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.is_active ? 'Actif' : 'Archivé'}</span></td>
                                <td className="px-6 py-4 text-right"><div className="flex justify-end gap-1">
                                    <button onClick={() => handleDuplicate(item)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><Copy className="w-4 h-4" /></button>
                                    <button onClick={() => handleOpenModal(item)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleToggleActiveRequest(item)} className={`p-2 rounded-full transition-colors ${!item.is_active ? 'text-green-600 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'}`}>{item.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}</button>
                                </div></td>
                            </tr>))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
            {isModalOpen && <TarifFormModal item={editingItem} onClose={handleCloseModal} onSubmit={handleSubmit} logiciels={logiciels} error={modalError} />}
            {itemToToggle && <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmToggleActive} loading={false} title={`${itemToToggle.is_active ? 'Archiver' : 'Restaurer'} le tarif`} message={`Êtes-vous sûr de vouloir ${itemToToggle.is_active ? 'archiver' : 'restaurer'} le tarif "${itemToToggle.nom}" ?`}/>}
        </div>
    );
}

