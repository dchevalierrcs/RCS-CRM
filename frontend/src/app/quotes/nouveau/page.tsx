// quotes/nouveau/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthProvider';
import useDebounce from '@/hooks/useDebounce';
import { Plus, Trash2, Save, Search, X, Book, Edit, ArrowLeft, Loader2, ChevronsUpDown } from 'lucide-react';

// --- Types ---
type ProductType = 'MATERIEL' | 'FORMATION' | 'PRESTATION_SERVICE' | 'ADDON' | 'LOGICIEL' | 'CUSTOM';
type QuoteType = 'LICENCES_ABONNEMENTS' | 'MATERIEL_PRESTATIONS';

interface Client { id: number; nom_radio: string; }
interface SearchResult { id: number; name: string; reference: string; product_type: ProductType; source_type: 'product' | 'tariff_grid'; }

interface QuoteItem {
  id: string; // ID Côté client (temporaire)
  product_id: number | null;
  product_type: ProductType;
  source_type: 'product' | 'tariff_grid' | 'custom' | null;
  description: string;
  description_en: string;
  quantity: number;
  unit_of_measure: 'jour' | 'mois' | 'unité';
  unit_price_ht: number;
  line_discount_percentage: number;
  tva_rate: number;
}

interface QuoteSection {
  id: string; // ID Côté client (temporaire)
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  items: QuoteItem[];
  display_order: number;
}

// --- Composants ---

const ClientSearch = ({ onSelect, initialClient }: { onSelect: (client: Client | null) => void, initialClient: Client | null }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const api = useApi();

    useEffect(() => { setSelectedClient(initialClient); }, [initialClient]);

    useEffect(() => {
        if (debouncedSearchTerm.length < 2) { setResults([]); return; }
        setIsLoading(true);
        api.get(`/clients/search?term=${debouncedSearchTerm}`)
            .then(data => setResults(data || []))
            .catch(err => console.error("Client search error:", err))
            .finally(() => setIsLoading(false));
    }, [debouncedSearchTerm, api]);
    
    if (selectedClient) {
        return <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"><span className="font-semibold text-blue-800">{selectedClient.nom_radio}</span><button onClick={() => { setSelectedClient(null); onSelect(null); }} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Changer</button></div>;
    }

    return <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher une radio..." className="w-full pl-10 pr-4 py-2 border rounded-lg"/>{isLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">...</div>}{results.length > 0 && <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">{results.map(client => <li key={client.id} onClick={() => { onSelect(client); setSelectedClient(client); setResults([]); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{client.nom_radio}</li>)}</ul>}</div>;
};


const QuoteTypeSelector = ({ onSelect }: { onSelect: (type: QuoteType) => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 space-y-4">
            <h2 className="text-xl font-bold">Quel type de devis souhaitez-vous créer ?</h2>
            <div className="flex gap-4">
                <button onClick={() => onSelect('LICENCES_ABONNEMENTS')} className="flex-1 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300">
                    <h3 className="font-bold">Licences & Abonnements</h3>
                    <p className="text-sm text-gray-600">Pour les logiciels, services récurrents et prestations associées (formation, installation).</p>
                </button>
                <button onClick={() => onSelect('MATERIEL_PRESTATIONS')} className="flex-1 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300">
                    <h3 className="font-bold">Matériel & Prestations</h3>
                    <p className="text-sm text-gray-600">Pour les ventes uniques de matériel et les prestations de service ponctuelles.</p>
                </button>
            </div>
        </div>
    </div>
);


export default function CreateQuotePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const api = useApi();
    
    const [quoteType, setQuoteType] = useState<QuoteType | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [initialClient, setInitialClient] = useState<Client | null>(null);
    const [subject, setSubject] = useState('');
    const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [validityDate, setValidityDate] = useState('');
    const [sections, setSections] = useState<QuoteSection[]>([]);
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [conditions, setConditions] = useState('Conditions standards...');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string|null>(null);

    useEffect(() => {
        const clientId = searchParams.get('clientId');
        if (clientId) {
            api.get(`/clients/${clientId}`).then(clientData => {
                if (clientData) {
                    const client = { id: clientData.id, nom_radio: clientData.nom_radio };
                    setInitialClient(client);
                    setSelectedClient(client);
                }
            }).catch(err => console.error("Could not fetch pre-selected client:", err));
        }
    }, [searchParams, api]);

    const handleAddSection = () => setSections(s => [...s, { id: `section-${Date.now()}`, title: 'Nouvelle Section', title_en: 'New Section', description: '', description_en: '', items: [], display_order: s.length }]);
    const handleUpdateSection = (id: string, field: keyof QuoteSection, value: any) => setSections(s => s.map(sec => sec.id === id ? { ...sec, [field]: value } : sec));
    const handleRemoveSection = (id: string) => setSections(s => s.filter(sec => sec.id !== id));
    
    const handleAddItem = (sectionId: string) => {
        const newItem: QuoteItem = { id: `item-${Date.now()}`, product_id: null, product_type: 'CUSTOM', source_type: 'custom', description: '', description_en: '', quantity: 1, unit_of_measure: 'unité', unit_price_ht: 0, line_discount_percentage: 0, tva_rate: 20.00 };
        setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, items: [...sec.items, newItem] } : sec));
    };
    
    const handleUpdateItem = (sectionId: string, itemId: string, field: keyof QuoteItem, value: any) => {
        setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) } : sec));
    };

    const handleRemoveItem = (sectionId: string, itemId: string) => {
        setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, items: sec.items.filter(i => i.id !== itemId) } : sec));
    };
    
    const handleSelectProduct = async (sectionId: string, itemId: string, product: SearchResult) => {
        if (!selectedClient) {
            alert("Veuillez d'abord sélectionner un client.");
            return;
        }
        try {
            const priceData = await api.post('/quotes/lookup-product', {
                clientId: selectedClient.id,
                itemId: product.id,
                itemType: product.product_type
            });
            handleUpdateItem(sectionId, itemId, 'product_id', priceData.product_id);
            handleUpdateItem(sectionId, itemId, 'product_type', priceData.product_type);
            handleUpdateItem(sectionId, itemId, 'source_type', product.source_type);
            handleUpdateItem(sectionId, itemId, 'description', priceData.description);
            handleUpdateItem(sectionId, itemId, 'description_en', priceData.description_en);
            handleUpdateItem(sectionId, itemId, 'unit_of_measure', priceData.unit_of_measure);
            handleUpdateItem(sectionId, itemId, 'unit_price_ht', priceData.unit_price_ht);
        } catch (error: any) {
            console.error("Erreur de lookup prix:", error);
            alert(`Erreur: ${error.message}`);
        }
    };
  
    const totals = useMemo(() => {
        let total_uniques = 0;
        let total_mensuel = 0;
        sections.forEach(s => s.items.forEach(i => {
            const lineTotal = (i.quantity * i.unit_price_ht) * (1 - (i.line_discount_percentage / 100));
            if (i.unit_of_measure === 'mois') total_mensuel += lineTotal;
            else total_uniques += lineTotal;
        }));
        const globalDiscountAmount = total_uniques * (globalDiscount / 100);
        const total_uniques_net = total_uniques - globalDiscountAmount;
        const total_tva = total_uniques_net * 0.20;
        const total_ttc = total_uniques_net + total_tva;
        return { total_uniques, globalDiscountAmount, total_uniques_net, total_tva, total_ttc, total_mensuel };
    }, [sections, globalDiscount]);
  
    const handleSave = async () => {
        if (!selectedClient || !subject || !quoteType) { setError("Un client, un objet et un type de devis sont requis."); return; }
        setIsSaving(true);
        setError(null);
        try {
            const initialQuote = await api.post('/quotes', { subject, client_id: selectedClient.id, quote_type: quoteType });
            const quoteId = initialQuote.quoteId;

            const finalQuoteData = {
                subject, client_id: selectedClient.id, quote_type: quoteType, emission_date: emissionDate, validity_date: validityDate || null,
                global_discount_percentage: globalDiscount, notes_internes: notes, conditions_commerciales: conditions,
                sections: sections.map((s, idx) => ({ ...s, display_order: idx, items: s.items.map((i, iidx) => ({...i, display_order: iidx})) })),
            };
            await api.put(`/quotes/${quoteId}`, finalQuoteData);
            router.push(`/quotes/${quoteId}`);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la sauvegarde.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!quoteType) return <QuoteTypeSelector onSelect={setQuoteType} />;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-200"><ArrowLeft className="w-5 h-5" /></button>
                    <div><h1 className="text-2xl font-bold text-slate-800">Nouveau Devis</h1><p className="text-sm text-slate-500 capitalize">{quoteType.replace('_', ' & ').toLowerCase()}</p></div>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
            </header>

            {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800">Contenu du devis</h3><button onClick={handleAddSection} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700"><Plus className="w-4 h-4"/>Ajouter section</button></div><div className="space-y-4">{sections.map(s => <QuoteSectionComponent key={s.id} section={s} onUpdate={handleUpdateSection} onRemove={handleRemoveSection} onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onRemoveItem={handleRemoveItem} onSelectProduct={handleSelectProduct} quoteType={quoteType}/>)}</div></div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border"><h3 className="font-bold mb-4">Informations Générales</h3><div className="space-y-4 text-sm"><div><label className="block font-medium text-slate-700 mb-1">Client*</label><ClientSearch onSelect={setSelectedClient} initialClient={initialClient} /></div><div><label className="block font-medium text-slate-700 mb-1">Objet du devis*</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border rounded-lg" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block font-medium text-slate-700 mb-1">Date d'émission</label><input type="date" value={emissionDate} onChange={(e) => setEmissionDate(e.target.value)} className="w-full p-2 border rounded-lg" /></div><div><label className="block font-medium text-slate-700 mb-1">Date de validité</label><input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="w-full p-2 border rounded-lg" /></div></div></div></div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border"><h3 className="font-bold mb-4">Conditions & Notes</h3><div className="space-y-4 text-sm"><div><label className="block font-medium text-slate-700 mb-1">Conditions commerciales</label><textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={4} className="w-full p-2 border rounded-lg"></textarea></div><div><label className="block font-medium text-slate-700 mb-1">Notes internes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-lg"></textarea></div></div></div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border sticky top-6"><h3 className="font-bold mb-4">Récapitulatif</h3><div className="space-y-2 text-sm">
                        {totals.total_uniques > 0 && <div className="flex justify-between"><span>Total Frais Uniques HT</span><span>{totals.total_uniques.toFixed(2)} €</span></div>}
                        {totals.total_uniques > 0 && <div className="flex justify-between items-center"><span>Remise Globale (%)</span><input type="number" value={globalDiscount} onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)} className="w-20 p-1 text-right border rounded"/></div>}
                        {totals.total_uniques > 0 && <div className="flex justify-between text-red-600"><span>Montant Remise</span><span>- {totals.globalDiscountAmount.toFixed(2)} €</span></div>}
                        {totals.total_uniques > 0 && <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total HT Net (unique)</span><span>{totals.total_uniques_net.toFixed(2)} €</span></div>}
                        {totals.total_uniques > 0 && <div className="flex justify-between"><span>TVA (20%)</span><span>{totals.total_tva.toFixed(2)} €</span></div>}
                        {totals.total_uniques > 0 && <div className="flex justify-between text-xl font-bold text-slate-800"><span>TOTAL TTC (unique)</span><span>{totals.total_ttc.toFixed(2)} €</span></div>}
                        {totals.total_mensuel > 0 && <div className="flex justify-between text-xl font-bold text-slate-800 border-t pt-2 mt-2"><span>TOTAL MENSUEL HT</span><span>{totals.total_mensuel.toFixed(2)} €</span></div>}
                    </div></div>
                </div>
            </div>
        </div>
    );
}

const QuoteSectionComponent = ({ section, onUpdate, onRemove, onAddItem, onUpdateItem, onRemoveItem, onSelectProduct, quoteType }: any) => (
    <div className="border p-4 rounded-lg bg-slate-50/50"><div className="flex justify-between items-start mb-3"><div className="flex-1 mr-4"><input type="text" value={section.title} onChange={e => onUpdate(section.id, 'title', e.target.value)} className="font-bold text-lg bg-transparent w-full focus:outline-none focus:bg-white px-1 -mx-1 rounded-md" placeholder="Titre de la section"/></div><div><button onClick={() => onAddItem(section.id)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200" title="Ajouter une ligne"><Plus className="w-4 h-4"/></button><button onClick={() => onRemove(section.id)} className="p-1 rounded-full text-red-500 hover:bg-red-100" title="Supprimer la section"><Trash2 className="w-4 h-4"/></button></div></div><div className="overflow-x-auto -mx-4"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left p-2 w-2/5 font-semibold">Description</th><th className="text-right p-2 font-semibold">Qté</th><th className="text-right p-2 font-semibold">Unité</th><th className="text-right p-2 font-semibold">P.U. HT</th><th className="text-right p-2 font-semibold">Rem. %</th><th className="text-right p-2 font-semibold">Total HT</th><th className="w-10"></th></tr></thead><tbody>{section.items.map((item: QuoteItem) => <QuoteItemComponent key={item.id} item={item} sectionId={section.id} onUpdate={onUpdateItem} onRemove={onRemoveItem} onSelectProduct={onSelectProduct} quoteType={quoteType}/>)}</tbody></table></div></div>
);

const QuoteItemComponent = ({ item, sectionId, onUpdate, onRemove, onSelectProduct, quoteType }: any) => {
    const [isSearching, setIsSearching] = useState(false);
    const lineTotal = useMemo(() => (item.quantity * item.unit_price_ht) * (1 - (item.line_discount_percentage / 100)), [item]);
    return <tr className="border-b last:border-none hover:bg-white"><td className="p-2"><div className="flex flex-col"><textarea value={item.description} onChange={e => onUpdate(sectionId, item.id, 'description', e.target.value)} rows={item.description?.split('\n').length || 1} className="w-full p-1 border rounded bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Description..."/>{isSearching ? <ProductSearch onSelect={(p) => { onSelectProduct(sectionId, item.id, p); setIsSearching(false); }} quoteType={quoteType} /> : <button onClick={() => setIsSearching(true)} className="text-xs text-blue-600 hover:underline mt-1 flex items-center self-start"><Book className="w-3 h-3 mr-1"/>Catalogue</button>}</div></td><td className="p-2"><input type="number" value={item.quantity} onChange={e => onUpdate(sectionId, item.id, 'quantity', parseFloat(e.target.value))} className="w-16 p-1 text-right border rounded"/></td><td className="p-2"><select value={item.unit_of_measure} onChange={e => onUpdate(sectionId, item.id, 'unit_of_measure', e.target.value)} className="w-full p-1 border rounded"><option value="unité">Unité</option><option value="jour">Jour</option><option value="mois">Mois</option></select></td><td className="p-2"><input type="number" value={item.unit_price_ht} onChange={e => onUpdate(sectionId, item.id, 'unit_price_ht', parseFloat(e.target.value))} className="w-24 p-1 text-right border rounded"/></td><td className="p-2"><input type="number" value={item.line_discount_percentage} onChange={e => onUpdate(sectionId, item.id, 'line_discount_percentage', parseFloat(e.target.value))} className="w-16 p-1 text-right border rounded"/></td><td className="p-2 text-right font-semibold">{lineTotal.toFixed(2)} €</td><td className="p-2 text-center"><button onClick={() => onRemove(sectionId, item.id)} className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100"><Trash2 className="w-4 h-4"/></button></td></tr>;
};

const ProductSearch = ({ onSelect, quoteType }: { onSelect: (p: SearchResult) => void, quoteType: QuoteType }) => {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedTerm = useDebounce(term, 300);
    const api = useApi();

    useEffect(() => {
        if (debouncedTerm.length < 2) { setResults([]); return; }
        setLoading(true);
        api.post('/quotes/search-products', { term: debouncedTerm, quote_type: quoteType })
            .then(data => setResults(data?.data || []))
            .catch(err => console.error("Erreur recherche produit:", err))
            .finally(() => setLoading(false));
    }, [debouncedTerm, quoteType, api]);
    
    return <div className="mt-2 relative"><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /><input type="text" value={term} onChange={e => setTerm(e.target.value)} placeholder="Rechercher un produit/tarif..." className="w-full pl-9 p-2 border rounded" autoFocus/>{loading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-slate-400"/>}</div>{results.length > 0 && <ul className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">{results.map(p => <li key={`${p.source_type}-${p.id}`} onClick={() => onSelect(p)} className="px-4 py-2 hover:bg-slate-100 cursor-pointer"><div className="font-bold">{p.name} <span className="text-xs text-slate-500">({p.reference})</span></div><div className="text-xs text-slate-600 capitalize">{p.product_type.toLowerCase().replace('_', ' ')}</div></li>)}</ul>}</div>;
};
