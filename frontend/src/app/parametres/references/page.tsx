// frontend/src/app/parametres/references/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { Settings, Plus, Edit, Trash2, Loader2, ArrowUp, ArrowDown, AlertCircle, Package, Archive, ArchiveRestore, AlertTriangle, FileText, Languages, DollarSign, ListTree, X, Copy } from 'lucide-react';

// --- TYPESCRIPT INTERFACES ---
interface ReferenceItem {
  id: number;
  nom?: string;
  name?: string; 
  code?: string;
  type_logiciel?: string;
  couleur?: string;
  editeur?: string;
  editeur_id?: number | null;
  ordre_affichage?: number;
  categorie?: string;
  permet_plusieurs_instances?: boolean;
  actif?: boolean;
  reference?: string;
  product_type?: 'MATERIEL' | 'FORMATION' | 'PRESTATION_SERVICE' | 'ADDON';
  unit_price_ht?: number | string | null;
  daily_rate_ht?: number | string | null;
  name_en?: string;
  description?: string;
  description_en?: string;
  is_active?: boolean;
  internal_label?: string;
  is_addon?: boolean;
  addon_rule?: 'PERCENTAGE' | 'FIXED_AMOUNT' | null;
  addon_value?: number | null;
  addon_basis_logiciel_id?: number | null;
  addon_basis_service_id?: number | null;
}

interface AudienceType {
  id: number;
  nom: string;
  description?: string;
}

interface Vague {
  id: number;
  nom: string;
  annee: number;
  type_audience_id: number;
}

type CrudResult = { success: boolean; error?: string };

type CrudHook<T> = {
  items: T[];
  loading: boolean;
  error: string | null;
  create: (data: Partial<T>) => Promise<CrudResult>;
  update: (id: number, data: Partial<T>) => Promise<CrudResult>;
  delete: (id: number) => Promise<CrudResult>;
  refresh: () => Promise<void>;
};

// --- HOOKS ---
const useAuth = () => {
  const logout = useCallback(() => {
    console.log("Logout action triggered");
    window.location.href = '/login';
  }, []);
  return useMemo(() => ({ logout }), [logout]);
};

const useApi = () => {
    const { logout } = useAuth();
    const baseURL = '/api';
    const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const url = `${baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const headers = new Headers(options.headers || {});
        if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }
        const config: RequestInit = { ...options, headers, credentials: 'include' };
        try {
            const response = await fetch(url, config);
            if (response.status === 401) { logout(); throw new Error('Session expirée.'); }
            const responseText = await response.text();
            const responseBody = responseText ? JSON.parse(responseText) : null;
            if (!response.ok) { throw new Error(responseBody?.message || 'Erreur API.'); }
            return responseBody?.data !== undefined ? responseBody.data : responseBody;
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }, [logout]);
    return useMemo(() => ({
        get: <T,>(endpoint: string): Promise<T> => request(endpoint),
        post: <T,>(endpoint: string, body: any): Promise<T> => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
        put: <T,>(endpoint: string, body: any): Promise<T> => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
        del: <T,>(endpoint: string): Promise<T> => request(endpoint, { method: 'DELETE' }),
    }), [request]);
};

const useCRUDReferences = <T extends { id: number }>(endpointName: string): CrudHook<T> => {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const api = useApi();
    const endpoint = useMemo(() => {
        const formattedEndpoint = endpointName.replace(/_/g, '-');
        const directRoutes = ['products', 'logiciels', 'services', 'editeurs', 'types-marche', 'statuts-client', 'types-diffusion', 'groupements'];
        if (directRoutes.includes(formattedEndpoint)) return `/${formattedEndpoint}`;
        return `/references/${formattedEndpoint}`;
    }, [endpointName]);
    
    const handleError = (err: unknown, op: string): CrudResult => {
        let msg = `Erreur lors de ${op}.`;
        if (err instanceof Error) {
            msg = err.message;
        } else if (typeof err === 'string') {
            msg = err;
        }
        setError(msg);
        return { success: false, error: msg };
    };
    
    const refresh = useCallback(async () => {
        setLoading(true); setError(null);
        try { 
            const result: any = await api.get(endpoint); 
            setItems(Array.isArray(result.data || result) ? (result.data || result) : []); 
        } 
        catch (err: unknown) { handleError(err, 'la récupération'); } 
        finally { setLoading(false); }
    }, [api, endpoint]);

    useEffect(() => { refresh(); }, [refresh]);
    
    const create = async (data: Partial<T>): Promise<CrudResult> => { try { await api.post(endpoint, data); return { success: true }; } catch (err) { return handleError(err, 'la création'); } };
    const update = async (id: number, data: Partial<T>): Promise<CrudResult> => { try { await api.put(`${endpoint}/${id}`, data); return { success: true }; } catch (err) { return handleError(err, 'la modification'); } };
    const deleteItem = async (id: number): Promise<CrudResult> => { try { await api.del(`${endpoint}/${id}`); return { success: true }; } catch (err) { return handleError(err, 'la suppression'); } };
    
    return { items, loading, error, create, update, delete: deleteItem, refresh };
};

// --- COMPOSANTS ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, loading }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; loading: boolean; }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md"><div className="p-6"><div className="flex items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3><div className="mt-2"><p className="text-sm text-gray-500">{message}</p></div></div></div></div><div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"><button type="button" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 w-full sm:ml-3 sm:w-auto" onClick={onConfirm} disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirmer'}</button><button type="button" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-indigo-500 mt-3 w-full sm:mt-0 sm:w-auto" onClick={onClose}>Annuler</button></div></div>
        </div>
    );
};

const AudienceSettings = () => {
  const [modalConfig, setModalConfig] = useState<{ type: 'type' | 'vague'; item: AudienceType | Vague | null } | null>(null);
  const typesAudienceCRUD = useCRUDReferences<AudienceType>('types_audience');
  const vaguesCRUD = useCRUDReferences<Vague>('vagues');
  const [modalError, setModalError] = useState<string|null>(null);

  const openModal = (type: 'type'|'vague', item: AudienceType | Vague | null = null) => { setModalError(null); setModalConfig({ type, item });}
  const handleSubmit = async (formData: Partial<AudienceType | Vague>) => {
    if (modalConfig) {
      const crud = modalConfig.type === 'type' ? typesAudienceCRUD : vaguesCRUD;
      const result = modalConfig.item ? await crud.update(modalConfig.item.id, formData) : await crud.create(formData);
      if (result.success) { await Promise.all([typesAudienceCRUD.refresh(), vaguesCRUD.refresh()]); setModalConfig(null); } 
      else { setModalError(result.error || "Une erreur est survenue."); }
    }
  };
  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Types d'Audience</h3><button onClick={() => openModal('type')} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><Plus className="w-4 h-4 mr-2"/>Ajouter</button></div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th><th className="relative px-6 py-3"></th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{typesAudienceCRUD.items.map(item => (<tr key={item.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nom}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-right"><button onClick={() => openModal('type', item)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><Edit className="w-4 h-4"/></button></td></tr>))}</tbody></table></div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Vagues de Mesure</h3><button onClick={() => openModal('vague')} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><Plus className="w-4 h-4 mr-2"/>Ajouter</button></div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="relative px-6 py-3"></th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{vaguesCRUD.items.map(item => (<tr key={item.id}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nom}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.annee}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typesAudienceCRUD.items.find(t=>t.id===item.type_audience_id)?.nom||'N/A'}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-right"><button onClick={() => openModal('vague', item)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><Edit className="w-4 h-4"/></button></td></tr>))}</tbody></table></div>
      </div>
      {modalConfig && <AudienceModal config={modalConfig} onClose={() => setModalConfig(null)} onSubmit={handleSubmit} typesAudience={typesAudienceCRUD.items} error={modalError} />}
    </div>
  );
};

const AudienceModal = ({ config, onClose, onSubmit, typesAudience, error }: { config: { type: 'type' | 'vague'; item: AudienceType | Vague | null }, onClose: () => void, onSubmit: (data: Partial<AudienceType | Vague>) => void, typesAudience: AudienceType[], error: string | null }) => {
    const [formData, setFormData] = useState<Partial<AudienceType | Vague>>(config.item || {});
    const isTypeModal = config.type === 'type';
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const inputStyle = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm";
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"><h3 className="text-lg font-bold mb-4">{config.item ? 'Modifier' : 'Ajouter'} {isTypeModal ? "un type" : "une vague"}</h3>
        <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }}>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center">{error}</div>}
            <div className="space-y-4"><div><label>Nom *</label><input type="text" name="nom" value={formData.nom||''} onChange={handleChange} required className={inputStyle} /></div>{isTypeModal ? (<div><label>Description</label><textarea name="description" value={(formData as AudienceType).description||''} onChange={handleChange} rows={3} className={inputStyle}></textarea></div>) : (<><div><label>Année *</label><input type="number" name="annee" value={(formData as Vague).annee||''} onChange={handleChange} required className={inputStyle} /></div><div><label>Type d'audience *</label><select name="type_audience_id" value={(formData as Vague).type_audience_id||''} onChange={handleChange} required className={inputStyle}><option value="">Sélectionner...</option>{typesAudience.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}</select></div></>)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-indigo-500">Annuler</button><button type="submit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Enregistrer</button></div></form></div></div>
    );
};

const initialFormData: Partial<ReferenceItem> = {
    nom: '', name: '', code: '', type_logiciel: 'programmation', couleur: '#cccccc',
    editeur_id: undefined, ordre_affichage: 0, categorie: '', permet_plusieurs_instances: false,
    reference: '', product_type: 'MATERIEL', unit_price_ht: 0, daily_rate_ht: 0,
    name_en: '', description: '', description_en: '', is_active: true,
    internal_label: '', is_addon: false, addon_rule: 'FIXED_AMOUNT', addon_value: 0,
    addon_basis_logiciel_id: null, addon_basis_service_id: null,
};

const ProductFormModal = ({ item, onClose, onSubmit, logiciels, services, error }: { item: Partial<ReferenceItem> | null; onClose: () => void; onSubmit: (data: Partial<ReferenceItem>) => void; logiciels: ReferenceItem[]; services: ReferenceItem[], error: string | null; }) => {
    const [formData, setFormData] = useState<Partial<ReferenceItem>>(item || initialFormData);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { name, value, type } = e.target; const checked = (e.target as HTMLInputElement).checked; setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };
    const inputStyle = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl"><button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X /></button>
                <div className="p-6 border-b"><h3 className="text-xl font-bold">{item?.id ? 'Modifier le Produit' : 'Créer un Produit'}</h3></div>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center">{error}</div>}
                        
                        <div className="p-4 border rounded-lg bg-slate-50/70">
                            <h4 className="flex items-center text-md font-semibold text-gray-700 mb-3"><FileText className="w-5 h-5 mr-2 text-slate-600" />Identification</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Référence*</label><input type="text" name="reference" value={formData.reference||''} onChange={handleChange} required className={inputStyle}/></div>
                                <div><label>Type*</label><select name="product_type" value={formData.product_type||'MATERIEL'} onChange={handleChange} required className={inputStyle}><option value="MATERIEL">Matériel</option><option value="FORMATION">Formation</option><option value="PRESTATION_SERVICE">Prestation de Service</option><option value="ADDON">Add-on</option></select></div>
                                <div className="md:col-span-2"><label>Label Interne (pour recherche)</label><input type="text" name="internal_label" value={formData.internal_label||''} onChange={handleChange} className={inputStyle}/></div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-slate-50/70">
                            <h4 className="flex items-center text-md font-semibold text-gray-700 mb-3"><Languages className="w-5 h-5 mr-2 text-slate-600" />Détails Publics (Devis)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label>Nom Public (FR)*</label><input type="text" name="name" value={formData.name||''} onChange={handleChange} required className={inputStyle}/></div>
                                <div><label>Nom Public (EN)</label><input type="text" name="name_en" value={formData.name_en||''} onChange={handleChange} className={inputStyle}/></div>
                                <div className="md:col-span-2"><label>Description (FR)</label><textarea name="description" value={formData.description||''} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                                <div className="md:col-span-2"><label>Description (EN)</label><textarea name="description_en" value={formData.description_en||''} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-slate-50/70">
                            <h4 className="flex items-center text-md font-semibold text-gray-700 mb-3"><DollarSign className="w-5 h-5 mr-2 text-slate-600" />Tarification & Règles</h4>
                            {formData.product_type === 'MATERIEL' && <div><label>Prix Unitaire HT (€)</label><input type="number" step="0.01" name="unit_price_ht" value={Number(formData.unit_price_ht||0)} onChange={handleChange} className={inputStyle}/></div>}
                            {['FORMATION', 'PRESTATION_SERVICE'].includes(formData.product_type || '') && <div><label>Taux Journalier HT (€)</label><input type="number" step="0.01" name="daily_rate_ht" value={Number(formData.daily_rate_ht||0)} onChange={handleChange} className={inputStyle}/></div>}
                            {formData.product_type === 'ADDON' && (
                                <div className="space-y-4">
                                    <input type="hidden" name="is_addon" value="true" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label>Règle de calcul</label><select name="addon_rule" value={formData.addon_rule||'FIXED_AMOUNT'} onChange={handleChange} className={inputStyle}><option value="FIXED_AMOUNT">Montant Fixe</option><option value="PERCENTAGE">Pourcentage</option></select></div>
                                        <div><label>{formData.addon_rule === 'PERCENTAGE' ? 'Pourcentage (%)' : 'Montant HT (€)'}</label><input type="number" step="0.01" name="addon_value" value={formData.addon_value||0} onChange={handleChange} className={inputStyle}/></div>
                                    </div>
                                    {formData.addon_rule === 'PERCENTAGE' && <div><label>Basé sur le produit</label><select name={formData.addon_basis_logiciel_id ? 'addon_basis_logiciel_id':'addon_basis_service_id'} value={formData.addon_basis_logiciel_id || formData.addon_basis_service_id || ''} onChange={(e) => { const val = e.target.value; setFormData(p => ({...p, addon_basis_logiciel_id: logiciels.some(l=>l.id===+val)?+val:null, addon_basis_service_id: services.some(s=>s.id===+val)?+val:null }));}} className={inputStyle}><option value="">Sélectionner un produit de base...</option><optgroup label="Logiciels">{logiciels.map(l => <option key={`l-${l.id}`} value={l.id}>{l.nom}</option>)}</optgroup><optgroup label="Services">{services.map(s => <option key={`s-${s.id}`} value={s.id}>{s.nom}</option>)}</optgroup></select></div>}
                                </div>
                            )}
                        </div>
                        {item?.id && <div className="flex items-center pt-2"><input type="checkbox" name="is_active" id="is_active" checked={!!formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300"/><label htmlFor="is_active" className="ml-2 block text-sm">Produit Actif</label></div>}
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t"><button type="button" onClick={onClose} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-indigo-500">Annuler</button><button type="submit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Enregistrer</button></div>
                </form>
            </div>
        </div>
    );
};

// --- PAGE PRINCIPALE ---
export default function ParametresReferencesPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [formData, setFormData] = useState<Partial<ReferenceItem>>(initialFormData);
  const [modalError, setModalError] = useState<string | null>(null);
  const [logicielFilter, setLogicielFilter] = useState('tous');
  const [sortConfig, setSortConfig] = useState<{key: keyof ReferenceItem, direction: 'ascending'|'descending'}>({ key: 'nom', direction: 'ascending' });
  
  const [itemToDelete, setItemToDelete] = useState<ReferenceItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const crudHooks: { [key: string]: CrudHook<ReferenceItem> } = { 
      logiciels: useCRUDReferences<ReferenceItem>('logiciels'), 
      editeurs: useCRUDReferences<ReferenceItem>('editeurs'), 
      services: useCRUDReferences<ReferenceItem>('services'), 
      statuts_client: useCRUDReferences<ReferenceItem>('statuts_client'), 
      types_marche: useCRUDReferences<ReferenceItem>('types_marche'), 
      types_diffusion: useCRUDReferences<ReferenceItem>('types_diffusion'), 
      groupements: useCRUDReferences<ReferenceItem>('groupements'), 
      products: useCRUDReferences<ReferenceItem>('products'),
  };
  
  useEffect(() => setSortConfig({ key: activeTab === 'statuts_client' ? 'ordre_affichage' : 'nom', direction: 'ascending' }), [activeTab]);
  const handleOpenModal = (item: ReferenceItem | null = null, defaults = {}) => { setModalError(null); setEditingItem(item); setFormData(item ? { ...item } : { ...initialFormData, ...defaults }); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData(initialFormData); setModalError(null); };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setModalError(null); const { name, value, type } = e.target; const checked = (e.target as HTMLInputElement).checked; setFormData((p: Partial<ReferenceItem>) => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };
  
  const handleDuplicate = (itemToDuplicate: ReferenceItem) => {
    const { id, ...newItemData } = itemToDuplicate;
    newItemData.reference = `${newItemData.reference || ''}_COPIE`;
    newItemData.name = `${newItemData.name || ''} (Copie)`;
    handleOpenModal(null, newItemData);
  };
  
  const handleSubmit = async (e: React.FormEvent | Partial<ReferenceItem>) => {
    if ('preventDefault' in e) e.preventDefault();
    const dataToSubmit = 'preventDefault' in e ? formData : e;
    
    setModalError(null);
    const crud = crudHooks[activeTab as keyof typeof crudHooks];
    if (!crud) return;

    let payload: Partial<ReferenceItem> = { ...dataToSubmit, is_addon: dataToSubmit.product_type === 'ADDON' };
    if (payload.product_type === 'MATERIEL') { payload.daily_rate_ht = null; }
    if (payload.product_type === 'FORMATION' || payload.product_type === 'PRESTATION_SERVICE') { payload.unit_price_ht = null; }
    if (payload.product_type !== 'ADDON') { 
        payload.addon_rule = null; 
        payload.addon_value = null; 
        payload.addon_basis_logiciel_id = null; 
        payload.addon_basis_service_id = null; 
    }
    if (payload.addon_rule === 'FIXED_AMOUNT') { payload.addon_basis_logiciel_id = null; payload.addon_basis_service_id = null; }

    const result: CrudResult = editingItem && editingItem.id ? await crud.update(editingItem.id, payload) : await crud.create(payload);
    if (result.success) { 
        await crud.refresh(); 
        if(activeTab === 'editeurs') { await crudHooks.logiciels.refresh(); await crudHooks.services.refresh(); } 
        handleCloseModal(); 
    } else { setModalError(result.error || "Une erreur inconnue est survenue."); }
  };
  
  const handleDeleteRequest = (item: ReferenceItem) => { setItemToDelete(item); setIsConfirmOpen(true); };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const crud = crudHooks[activeTab as keyof typeof crudHooks];
    const res: CrudResult = await crud.delete(itemToDelete.id);
    if (res.success) { await crud.refresh(); } 
    else if(res.error) { setModalError(res.error); }
    setIsConfirmOpen(false);
    setItemToDelete(null);
  };
  
  const handleSort = (key: keyof ReferenceItem) => setSortConfig(p => ({ key, direction: p.key === key && p.direction === 'ascending' ? 'descending' : 'ascending' }));
  const tabsConfig = { audiences: { title: 'Audiences' }, products: { title: 'Catalogue Produits' }, logiciels: { title: 'Logiciels' }, editeurs: { title: 'Editeurs' }, services: { title: 'Services' }, statuts_client: { title: 'Statuts Client' }, types_marche: { title: 'Types de Marché' }, types_diffusion: { title: 'Types de Diffusion' }, groupements: { title: 'Groupements' }, };
  const currentHook = crudHooks[activeTab as keyof typeof crudHooks];

  const processedItems = useMemo(() => {
    if (!currentHook?.items) return [];
    let items: ReferenceItem[] = [...currentHook.items].map(item => ({ ...item, editeur: (activeTab === 'logiciels' || activeTab === 'services') ? crudHooks.editeurs.items.find((e: ReferenceItem)=>e.id===item.editeur_id)?.nom||'N/A' : undefined }));
    if (activeTab === 'logiciels' && logicielFilter !== 'tous') items = items.filter(i => i.type_logiciel === logicielFilter);
    items.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
    return items;
  }, [currentHook?.items, crudHooks.editeurs.items, logicielFilter, activeTab, sortConfig]);
  
  const renderSortArrow = (key: keyof ReferenceItem) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 text-slate-400"/> : <ArrowDown className="h-3 w-3 text-slate-400"/>
  };

  const renderTableHeader = (key: keyof ReferenceItem, label: string) => (
    <th scope="col" className="px-6 py-3">
      <button onClick={() => handleSort(key)} className="flex items-center gap-1.5 group">
        <span className="font-semibold">{label}</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {renderSortArrow(key)}
        </span>
      </button>
    </th>
  );
  
  const hasColor = ['types_marche', 'groupements', 'statuts_client', 'types_diffusion'].includes(activeTab);

  return (
    <Fragment>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Catalogue & Références</h1>
          <p className="text-slate-600 mt-1">Gérez les listes de valeurs et le catalogue de produits de votre application.</p>
        </div>

        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {Object.entries(tabsConfig).map(([key, { title }]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`shrink-0 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {title}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'audiences' ? <AudienceSettings /> : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 flex justify-between items-center border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{tabsConfig[activeTab as keyof typeof tabsConfig].title}</h2>
                  {activeTab === 'logiciels' && (
                    <div className="mt-2 flex items-center text-sm space-x-1">
                      {Object.entries({'tous':'Tous','programmation':'Programmation','diffusion':'Diffusion','planification':'Planification','streaming':'Streaming'}).map(([k, l])=><button key={k} onClick={()=>setLogicielFilter(k)} className={`px-3 py-1 rounded-full ${logicielFilter===k?'bg-blue-100 text-blue-700 font-semibold':'text-slate-500 hover:bg-slate-100'}`}>{l}</button>)}
                    </div>
                  )}
                </div>
                <button onClick={() => handleOpenModal(null, activeTab === 'logiciels' && logicielFilter !== 'tous' ? { type_logiciel: logicielFilter } : {})} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                {currentHook?.loading ? (
                  <div className="flex justify-center items-center p-10">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600"/>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        {activeTab === 'products' && <>
                          {renderTableHeader('reference', 'Référence')}
                          {renderTableHeader('name', 'Nom')}
                          <th className="px-6 py-3 font-semibold uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 font-semibold uppercase tracking-wider">Prix/Tarif HT</th>
                          {renderTableHeader('is_active', 'Statut')}
                        </>}
                        {activeTab !== 'products' && <>
                          {activeTab === 'statuts_client' && renderTableHeader('ordre_affichage', 'Ordre')}
                          {activeTab.match(/statuts_client|types_diffusion/) && renderTableHeader('code', 'Code')}
                          {renderTableHeader('nom', 'Nom')}
                          {activeTab === 'logiciels' && <>
                            {renderTableHeader('type_logiciel', 'Type')}
                            {renderTableHeader('editeur', 'Editeur')}
                          </>}
                          {activeTab === 'services' && <>
                            {renderTableHeader('categorie', 'Catégorie')}
                            {renderTableHeader('editeur', 'Editeur')}
                            {renderTableHeader('permet_plusieurs_instances', 'Inst. Multiples')}
                          </>}
                          {hasColor && <th className="px-6 py-3 font-semibold uppercase tracking-wider">Couleur</th>}
                        </>}
                        <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {processedItems.map((item: ReferenceItem) => (
                        <tr key={item.id} className={`bg-white hover:bg-slate-50 ${!item.is_active && activeTab === 'products' ? 'opacity-60' : ''}`}>
                          {activeTab === 'products' && <>
                            <td className="px-6 py-4 text-xs font-medium text-slate-800">{item.reference}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">{item.product_type}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-700">
                              {item.product_type === 'MATERIEL' && `${Number(item.unit_price_ht || 0).toFixed(2)}€/u`}
                              {['FORMATION', 'PRESTATION_SERVICE'].includes(item.product_type || '') && `${Number(item.daily_rate_ht || 0).toFixed(2)}€/j`}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {item.is_active ? 'Actif' : 'Archivé'}
                              </span>
                            </td>
                          </>}
                          {activeTab !== 'products' && <>
                            {activeTab === 'statuts_client' && <td className="px-6 py-4">{item.ordre_affichage}</td>}
                            {activeTab.match(/statuts_client|types_diffusion/) && <td className="px-6 py-4 text-xs">{item.code}</td>}
                            <td className="px-6 py-4 font-medium text-slate-900">{item.nom}</td>
                            {activeTab === 'logiciels' && <>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">{item.type_logiciel}</span></td>
                              <td className="px-6 py-4">{item.editeur}</td>
                            </>}
                            {activeTab === 'services' && <>
                              <td className="px-6 py-4">{item.categorie}</td>
                              <td className="px-6 py-4">{item.editeur}</td>
                              <td className="px-6 py-4">{item.permet_plusieurs_instances ? 'Oui' : 'Non'}</td>
                            </>}
                            {hasColor && <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><span className="h-5 w-5 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: item.couleur || '#fff' }}></span><span className="text-xs">{item.couleur || 'N/A'}</span></span></td>}
                          </>}
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                                {activeTab === 'products' && 
                                    <button onClick={() => handleDuplicate(item)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Dupliquer">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                }
                                <button onClick={() => handleOpenModal(item)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="Modifier">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteRequest(item)} className={`p-2 rounded-full transition-colors ${item.is_active === false ? 'text-green-600 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'}`} title={activeTab === 'products' ? (item.is_active ? 'Archiver' : 'Restaurer') : 'Supprimer'}>
                                    {activeTab === 'products' ? (item.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />) : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isModalOpen && activeTab === 'products' && <ProductFormModal item={editingItem} onClose={handleCloseModal} onSubmit={(data) => handleSubmit(data)} logiciels={crudHooks.logiciels.items} services={crudHooks.services.items} error={modalError} />}
      
      {isModalOpen && activeTab !== 'products' && activeTab !== 'audiences' && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h3 className="text-lg font-bold mb-6">{editingItem?'Modifier':'Ajouter'}</h3>
        <form onSubmit={handleSubmit}>
            {modalError && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center"><AlertCircle className="w-5 h-5 mr-2" /><span>{modalError}</span></div>}
            <div className="space-y-4">
                {activeTab.match(/editeurs|types_marche|groupements|statuts_client|types_diffusion|logiciels|services/)&&<div><label>Nom*</label><input type="text" name="nom" value={formData.nom||''} onChange={handleFormChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"/></div>}
                {activeTab.match(/statuts_client|types_diffusion/)&&<div><label>Code*</label><input type="text" name="code" value={formData.code||''} onChange={handleFormChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"/></div>}
                {activeTab==='statuts_client'&&<div><label>Ordre</label><input type="number" name="ordre_affichage" value={formData.ordre_affichage||0} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"/></div>}
                {hasColor && <div><label>Couleur</label><div className="mt-1 flex items-center gap-3"><input type="color" name="couleur" value={formData.couleur||'#cccccc'} onChange={handleFormChange} className="h-10 w-10 p-1 border rounded-md" /><input type="text" value={formData.couleur||''} onChange={handleFormChange} name="couleur" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm" placeholder="#RRGGBB" /></div></div>}
                {activeTab==='logiciels'&&<><div><label>Type</label><select name="type_logiciel" value={formData.type_logiciel||'programmation'} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"><option value="programmation">Programmation</option><option value="diffusion">Diffusion</option><option value="planification">Planification</option><option value="streaming">Streaming</option></select></div><div><label>Editeur</label><select name="editeur_id" value={formData.editeur_id||''} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"><option value="">Sélectionner...</option>{crudHooks.editeurs.items.map((e: ReferenceItem) => <option key={e.id} value={e.id}>{e.nom}</option>)}</select></div></>}
                {activeTab==='services'&&<><div><label>Catégorie</label><input type="text" name="categorie" value={formData.categorie||''} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"/></div><div><label>Editeur</label><select name="editeur_id" value={formData.editeur_id||''} onChange={handleFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-slate-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm"><option value="">Aucun</option>{crudHooks.editeurs.items.map((e: ReferenceItem) => <option key={e.id} value={e.id}>{e.nom}</option>)}</select></div><div className="flex items-center pt-2"><input type="checkbox" name="permet_plusieurs_instances" checked={!!formData.permet_plusieurs_instances} onChange={handleFormChange} /><label className="ml-2 block text-sm">Peut être ajouté plusieurs fois</label></div></>}
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={handleCloseModal} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-indigo-500">Annuler</button><button type="submit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={currentHook?.loading}>{currentHook?.loading?<Loader2 className="w-4 h-4 animate-spin"/>:'Enregistrer'}</button></div>
        </form>
      </div></div>}

      <ConfirmationModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={confirmDelete}
        loading={false}
        title={`${itemToDelete?.is_active === false ? 'Restaurer' : 'Archiver'} l'élément`}
        message={`Êtes-vous sûr de vouloir ${itemToDelete?.is_active === false ? 'restaurer' : 'archiver'} cet élément ?`}
      />
    </Fragment>
  );
}

