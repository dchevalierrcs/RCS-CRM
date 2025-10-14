// quotes/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Save, Search, X, Book, Edit, ArrowLeft, Loader2, FileText, Settings, Download } from 'lucide-react';

// --- Hook useDebounce implémenté localement ---
const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

// --- API Wrapper simplifié ---
const useApi = () => {
    const request = useCallback(async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any) => {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        // CORRECTION : Ajout de l'URL complète du backend pour pointer vers le port 5000
        const finalUrl = `http://localhost:5000${url.startsWith('/api') ? url : `/api${url}`}`;
        const response = await fetch(finalUrl, options);

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.message || 'Network response was not ok');
        }
        return await response.json();
    }, []);

    return useMemo(() => ({
        get: (url: string) => request('GET', url),
        post: (url: string, body: any) => request('POST', url, body),
        put: (url: string, body: any) => request('PUT', url, body),
        delete: (url: string) => request('DELETE', url),
    }), [request]);
};

// --- Types de Données ---
type QuoteType = 'LICENCES_ABONNEMENTS' | 'MATERIEL_PRESTATIONS';
type ProductType = | 'LOGICIEL' | 'SERVICE_ABONNEMENT' | 'MATERIEL' | 'FORMATION' | 'PRESTATION_SERVICE' | 'CUSTOM';
type UnitOfMeasure = 'mois' | 'jour' | 'unité' | 'heure' | 'an';

interface Client { id: number; nom_radio: string; }
interface ProductFromCatalogue { id: number; reference: string; name: string; name_en: string | null; internal_label: string | null; description: string | null; description_en: string | null; product_type: ProductType; price: number | null; }
interface QuoteItem { id: string | number; product_id: number | null; product_type: ProductType; description: string; description_en: string; quantity: number; unit_of_measure: UnitOfMeasure; unit_price_ht: number; line_discount_percentage: number; tva_rate: number; display_order: number; }
interface QuoteSection { id: string | number; title: string; title_en: string; description: string; description_en: string; items: QuoteItem[]; display_order: number; }

// ============================================================================
// --- COMPOSANT PRINCIPAL : PAGE DE CRÉATION/ÉDITION DE DEVIS ---
// ============================================================================
export default function QuoteFormPage({ quoteId }: { quoteId?: number }) {
  const api = useApi();
  const isEditMode = !!quoteId;

  const [isLoadingPage, setIsLoadingPage] = useState(isEditMode);
  const [quoteType, setQuoteType] = useState<QuoteType | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [subject, setSubject] = useState('');
  const [emissionDate, setEmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDate, setValidityDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [sections, setSections] = useState<QuoteSection[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Chargement des données pour le mode édition ---
  useEffect(() => {
    if (isEditMode) {
      const fetchQuoteData = async () => {
        setIsLoadingPage(true);
        try {
          const result = await api.get(`/quotes/${quoteId}`);
          const data = result.data;
          setQuoteType(data.quote_type);
          setSelectedClient({ id: data.client_id, nom_radio: data.client_nom });
          setSubject(data.subject);
          setEmissionDate(new Date(data.emission_date).toISOString().split('T')[0]);
          setValidityDate(new Date(data.validity_date).toISOString().split('T')[0]);
          setGlobalDiscount(data.global_discount_percentage || 0);
          setConditions(data.conditions_commerciales || '');
          setNotes(data.notes_internes || '');
          setSections(data.sections || []);
        } catch (error) {
          console.error("Erreur lors du chargement du devis:", error);
          alert("Impossible de charger les données du devis.");
        } finally {
          setIsLoadingPage(false);
        }
      };
      fetchQuoteData();
    }
  }, [quoteId, isEditMode, api]);

  const handleAddSection = () => { setSections([...sections, { id: `section-${Date.now()}`, title: `Nouvelle Section`, title_en: 'New Section', description: '', description_en: '', items: [], display_order: sections.length }]); };
  const handleUpdateSection = (sectionId: string | number, field: keyof QuoteSection, value: string) => { setSections(sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s)); };
  const handleRemoveSection = (sectionId: string | number) => { setSections(sections.filter(s => s.id !== sectionId)); };
  const handleAddItem = (sectionId: string | number) => { const newItem: QuoteItem = { id: `item-${Date.now()}`, product_id: null, product_type: 'CUSTOM', description: '', description_en: '', quantity: 1, unit_of_measure: 'unité', unit_price_ht: 0, line_discount_percentage: 0, tva_rate: 20.00, display_order: (sections.find(s => s.id === sectionId)?.items.length || 0) }; setSections(sections.map(s => s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s)); };
  const handleUpdateItem = (sectionId: string | number, itemId: string | number, field: keyof QuoteItem, value: any) => { setSections(sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) } : s)); };
  const handleRemoveItem = (sectionId: string | number, itemId: string | number) => { setSections(sections.map(s => s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s)); };

  const handleSelectProduct = async (sectionId: string | number, itemId: string | number, product: ProductFromCatalogue) => {
    let finalPrice = product.price || 0;
    let unitOfMeasure: UnitOfMeasure = 'unité';

    if (['LOGICIEL', 'SERVICE_ABONNEMENT'].includes(product.product_type)) {
      unitOfMeasure = 'mois';
      if (selectedClient) {
        try {
          const priceData = await api.post('/quotes/lookup-product', { clientId: selectedClient.id, itemId: product.id, itemType: product.product_type });
          finalPrice = parseFloat(priceData.data.unit_price_ht);
        } catch (error) { console.error("Erreur de recherche de prix:", error); alert("Tarif automatique non trouvé. Saisir le prix manuellement."); }
      } else { alert("Sélectionner un client avant d'ajouter un produit à abonnement."); return; }
    } else if (['FORMATION', 'PRESTATION_SERVICE'].includes(product.product_type)) { unitOfMeasure = 'jour'; }

    setSections(sections.map(s => s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, product_id: product.id, product_type: product.product_type, description: product.name, description_en: product.name_en || product.name, unit_price_ht: finalPrice, unit_of_measure: unitOfMeasure } : i) } : s));
  };
  
  const totals = useMemo(() => {
    let uniques_ht_brut = 0;
    let recurrents_ht_mensuel = 0;
    sections.forEach(s => s.items.forEach(i => {
      const lineNet = (i.quantity * i.unit_price_ht) * (1 - (i.line_discount_percentage / 100));
      if (['LOGICIEL', 'SERVICE_ABONNEMENT'].includes(i.product_type)) { recurrents_ht_mensuel += lineNet; } else { uniques_ht_brut += lineNet; }
    }));
    const globalDiscountAmount = uniques_ht_brut * (globalDiscount / 100);
    const uniques_ht_net = uniques_ht_brut - globalDiscountAmount;
    const tva = uniques_ht_net * 0.20;
    const ttc = uniques_ht_net + tva;
    return { uniques: { ht_brut: uniques_ht_brut, remise: globalDiscountAmount, ht_net: uniques_ht_net, tva, ttc }, recurrents: { ht_mensuel: recurrents_ht_mensuel } };
  }, [sections, globalDiscount]);
  
  const handleSaveQuote = async () => {
    if (!selectedClient || !subject || !quoteType) { alert("Client, objet et type de devis sont requis."); return; }
    setIsSaving(true);
    const quoteData = { client_id: selectedClient.id, subject, quote_type: quoteType, emission_date: emissionDate, validity_date: validityDate || null, global_discount_percentage: globalDiscount, conditions_commerciales: conditions, notes_internes: notes, sections: sections.map((s, si) => ({ ...s, display_order: si, items: s.items.map((i, ii) => ({ ...i, display_order: ii })) })) };
    try {
      if (isEditMode) {
        await api.put(`/quotes/${quoteId}`, quoteData);
        alert(`Devis mis à jour avec succès !`);
      } else {
        const result = await api.post('/quotes', quoteData);
        alert(`Devis ${result.data.quote_number} créé avec succès !`);
        window.location.href = `/quotes/edit/${result.data.quoteId}`; // Redirection après création
      }
    } catch (error) { console.error("Erreur sauvegarde:", error); alert("Une erreur est survenue."); } 
    finally { setIsSaving(false); }
  };

  const handleDownloadPDF = (lang: 'fr' | 'en') => {
    if (isEditMode) {
      window.open(`/api/quotes/${quoteId}/pdf?lang=${lang}`, '_blank');
    }
  };

  if (isLoadingPage) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (!quoteType && !isEditMode) {
    return <QuoteTypeSelectionModal onSelect={setQuoteType} />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Modifier le devis' : 'Créer un nouveau devis'}</h1>
                    <p className="text-sm text-gray-500">{quoteType === 'LICENCES_ABONNEMENTS' ? 'Type: Licences & Abonnements' : 'Type: Matériel & Prestations'}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isEditMode && (
                    <>
                        <button onClick={() => handleDownloadPDF('fr')} className="btn-modern btn-secondary"><Download className="w-4 h-4 mr-2"/>PDF (FR)</button>
                        <button onClick={() => handleDownloadPDF('en')} className="btn-modern btn-secondary"><Download className="w-4 h-4 mr-2"/>PDF (EN)</button>
                    </>
                )}
                <button onClick={handleSaveQuote} disabled={isSaving} className="btn-modern btn-primary">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    {isSaving ? "Sauvegarde..." : (isEditMode ? "Mettre à jour" : "Sauvegarder")}
                </button>
            </div>
        </header>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Contenu du devis</h3>
                    <button onClick={handleAddSection} className="btn-modern btn-secondary text-sm">
                        <Plus className="w-4 h-4 mr-2"/>Ajouter une section
                    </button>
                </div>
                <div className="space-y-4">
                    {sections.map(section => (
                        <QuoteSectionComponent 
                            key={section.id} 
                            section={section}
                            quoteType={quoteType!}
                            onUpdateSection={handleUpdateSection}
                            onRemoveSection={handleRemoveSection}
                            onAddItem={() => handleAddItem(section.id)}
                            onUpdateItem={handleUpdateItem}
                            onRemoveItem={handleRemoveItem}
                            onSelectProduct={handleSelectProduct}
                        />
                    ))}
                </div>
            </div>
        </div>
        <div className="col-span-1 space-y-6">
              {/* Informations Générales */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-bold mb-4">Informations Générales</h3>
                  <div className="space-y-4 text-sm">
                      <div>
                          <label htmlFor="client" className="block font-medium text-gray-700 mb-1">Client</label>
                          <ClientSearch onClientSelect={setSelectedClient} selectedClient={selectedClient} disabled={isEditMode} />
                      </div>
                      <div>
                          <label htmlFor="subject" className="block font-medium text-gray-700 mb-1">Objet du devis</label>
                          <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label htmlFor="emissionDate" className="block font-medium text-gray-700 mb-1">Date d'émission</label>
                              <input type="date" id="emissionDate" value={emissionDate} onChange={(e) => setEmissionDate(e.target.value)} className="w-full p-2 border rounded-lg" />
                          </div>
                           <div>
                              <label htmlFor="validityDate" className="block font-medium text-gray-700 mb-1">Date de validité</label>
                              <input type="date" id="validityDate" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="w-full p-2 border rounded-lg" />
                          </div>
                      </div>
                  </div>
              </div>
              
               {/* Conditions & Notes */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-bold mb-4">Conditions & Notes</h3>
                   <div className="space-y-4 text-sm">
                        <div>
                          <label htmlFor="conditions" className="block font-medium text-gray-700 mb-1">Conditions commerciales</label>
                          <textarea id="conditions" value={conditions} onChange={e => setConditions(e.target.value)} rows={4} className="w-full p-2 border rounded-lg"></textarea>
                      </div>
                       <div>
                          <label htmlFor="notes" className="block font-medium text-gray-700 mb-1">Notes internes (non visible par le client)</label>
                          <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 border rounded-lg"></textarea>
                      </div>
                  </div>
              </div>

            {/* Récapitulatif */}
            <div className="bg-white p-4 rounded-lg shadow-sm sticky top-6">
                <h3 className="font-bold mb-4">Récapitulatif</h3>
                {quoteType === 'LICENCES_ABONNEMENTS' ? (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-600 mb-2 border-b pb-1">Frais Uniques</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span>Total HT Brut</span><span>{totals.uniques.ht_brut.toFixed(2)} €</span></div>
                                <div className="flex justify-between items-center"><span>Remise Globale (%)</span><input type="number" value={globalDiscount} onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)} className="w-20 p-1 text-right border rounded"/></div>
                                <div className="flex justify-between text-red-600"><span>Montant Remise</span><span>- {totals.uniques.remise.toFixed(2)} €</span></div>
                                <hr className="my-1"/>
                                <div className="flex justify-between font-bold"><span>Total HT Net</span><span>{totals.uniques.ht_net.toFixed(2)} €</span></div>
                                <div className="flex justify-between"><span>TVA (20%)</span><span>{totals.uniques.tva.toFixed(2)} €</span></div>
                                <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-1 mt-1"><span>Total TTC</span><span>{totals.uniques.ttc.toFixed(2)} €</span></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-600 mb-2 border-b pb-1">Frais Récurrents</h4>
                            <div className="flex justify-between text-xl font-bold text-gray-800">
                                <span>Total Mensuel HT</span>
                                <span>{totals.recurrents.ht_mensuel.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Total HT Brut</span><span>{totals.uniques.ht_brut.toFixed(2)} €</span></div>
                        <div className="flex justify-between items-center"><span>Remise Globale (%)</span><input type="number" value={globalDiscount} onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)} className="w-20 p-1 text-right border rounded"/></div>
                        <div className="flex justify-between text-red-600"><span>Montant Remise</span><span>- {totals.uniques.remise.toFixed(2)} €</span></div>
                        <hr className="my-2"/>
                        <div className="flex justify-between font-bold"><span>Total HT Net</span><span>{totals.uniques.ht_net.toFixed(2)} €</span></div>
                        <div className="flex justify-between"><span>TVA (20%)</span><span>{totals.uniques.tva.toFixed(2)} €</span></div>
                        <div className="flex justify-between text-2xl font-bold text-gray-800 border-t pt-2 mt-2"><span>TOTAL TTC</span><span>{totals.uniques.ttc.toFixed(2)} €</span></div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// --- SOUS-COMPOSANTS ---
// ============================================================================

const QuoteTypeSelectionModal = ({ onSelect }: { onSelect: (type: QuoteType) => void }) => (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Nouveau Devis</h2>
            <p className="text-gray-600 mb-6">Veuillez sélectionner le type de devis que vous souhaitez créer. Ce choix est définitif et déterminera les produits disponibles.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => onSelect('LICENCES_ABONNEMENTS')} className="p-4 border rounded-lg hover:bg-gray-100 hover:border-blue-500 text-left">
                    <h3 className="font-bold">Licences & Abonnements</h3>
                    <p className="text-xs text-gray-600">Pour les logiciels, services récurrents, formations et prestations associées.</p>
                </button>
                <button onClick={() => onSelect('MATERIEL_PRESTATIONS')} className="p-4 border rounded-lg hover:bg-gray-100 hover:border-blue-500 text-left">
                    <h3 className="font-bold">Matériel & Prestations</h3>
                    <p className="text-xs text-gray-600">Pour la vente de matériel, de formations ou de services ponctuels.</p>
                </button>
            </div>
        </div>
    </div>
);

const ClientSearch = ({ onClientSelect, selectedClient, disabled }: { onClientSelect: (client: Client) => void, selectedClient: Client | null, disabled: boolean }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const api = useApi();

    useEffect(() => {
        const searchClients = async () => {
            if (debouncedSearchTerm.length < 2) {
                setResults([]); return;
            }
            setIsLoading(true);
            try {
                // CORRECTION: La réponse API est un objet { success, data }, il faut extraire 'data'.
                const response = await api.get(`/clients/search?term=${debouncedSearchTerm}`);
                setResults(response.data || []);
            } catch (error) { console.error("Erreur recherche client:", error); setResults([]); }
            finally { setIsLoading(false); }
        };
        if (!disabled) {
          searchClients();
        }
    }, [debouncedSearchTerm, api, disabled]);

    if (selectedClient) {
        return (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-semibold text-blue-800">{selectedClient.nom_radio}</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une radio..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                disabled={disabled}
            />
            {isLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Recherche...</div>}
            {results.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map(client => (
                        <li key={client.id}
                            onClick={() => { onClientSelect(client); setSearchTerm(''); setResults([]); }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                            {client.nom_radio}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const QuoteSectionComponent = ({ section, quoteType, onUpdateSection, onRemoveSection, onAddItem, onUpdateItem, onRemoveItem, onSelectProduct }: any) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    return (
        <div className="border p-4 rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-3">
                {isEditingTitle ? ( <input type="text" value={section.title} onChange={e => onUpdateSection(section.id, 'title', e.target.value)} onBlur={() => setIsEditingTitle(false)} autoFocus className="font-bold text-lg border-b-2 border-blue-500"/>
                ) : ( <h4 className="font-bold text-lg flex items-center" onClick={() => setIsEditingTitle(true)}> {section.title} <Edit className="w-3 h-3 ml-2 text-gray-400 cursor-pointer"/> </h4> )}
                <div>
                    <button onClick={onAddItem} className="btn-icon btn-secondary mr-2" title="Ajouter une ligne"><Plus className="w-4 h-4"/></button>
                    <button onClick={() => onRemoveSection(section.id)} className="btn-icon btn-danger" title="Supprimer la section"><Trash2 className="w-4 h-4"/></button>
                </div>
            </div>
            <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left p-2 w-2/5">Description</th><th className="text-right p-2">Qté</th><th className="text-right p-2">Unité</th><th className="text-right p-2">P.U. HT</th><th className="text-right p-2">Remise %</th><th className="text-right p-2">Total HT</th><th className="text-center p-2"></th></tr></thead>
                <tbody>{section.items.map((item: QuoteItem) => ( <QuoteItemComponent key={item.id} item={item} sectionId={section.id} quoteType={quoteType} onUpdateItem={onUpdateItem} onRemoveItem={onRemoveItem} onSelectProduct={onSelectProduct}/> ))}</tbody>
            </table>
        </div>
    );
};

const QuoteItemComponent = ({ item, sectionId, quoteType, onUpdateItem, onRemoveItem, onSelectProduct }: any) => {
    const [showProductSearch, setShowProductSearch] = useState(false);
    const lineTotal = useMemo(() => (item.quantity * item.unit_price_ht) * (1 - (item.line_discount_percentage / 100)), [item.quantity, item.unit_price_ht, item.line_discount_percentage]);
    return (
        <tr className="border-b last:border-none hover:bg-gray-50">
            <td className="p-2 align-top">
                <textarea value={item.description} onChange={e => onUpdateItem(sectionId, item.id, 'description', e.target.value)} rows={2} className="w-full p-1 border rounded" placeholder="Description..."/>
                <button onClick={() => setShowProductSearch(!showProductSearch)} className="text-xs text-blue-600 hover:underline mt-1 flex items-center"> <Book className="w-3 h-3 mr-1"/> {item.product_id ? "Changer de produit" : "Choisir un produit"} </button>
                {showProductSearch && ( <ProductSearch quoteType={quoteType} onSelect={(product) => { onSelectProduct(sectionId, item.id, product); setShowProductSearch(false); }}/> )}
            </td>
            <td className="p-2 align-top"><input type="number" value={item.quantity} onChange={e => onUpdateItem(sectionId, item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-16 p-1 text-right border rounded"/></td>
            <td className="p-2 align-top">
                <select value={item.unit_of_measure} onChange={e => onUpdateItem(sectionId, item.id, 'unit_of_measure', e.target.value)} className="w-full p-1 border rounded bg-white">
                    <option value="unité">Unité</option><option value="jour">Jour</option><option value="heure">Heure</option><option value="mois">Mois</option><option value="an">An</option>
                </select>
            </td>
            <td className="p-2 align-top"><input type="number" value={item.unit_price_ht} onChange={e => onUpdateItem(sectionId, item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)} className="w-24 p-1 text-right border rounded"/></td>
            <td className="p-2 align-top"><input type="number" value={item.line_discount_percentage} onChange={e => onUpdateItem(sectionId, item.id, 'line_discount_percentage', parseFloat(e.target.value) || 0)} className="w-16 p-1 text-right border rounded"/></td>
            <td className="p-2 align-top text-right font-semibold">{lineTotal.toFixed(2)} €</td>
            <td className="p-2 align-top text-center">
                <button onClick={() => onRemoveItem(sectionId, item.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            </td>
        </tr>
    );
};

const ProductSearch = ({ quoteType, onSelect }: { quoteType: QuoteType, onSelect: (product: ProductFromCatalogue) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<ProductFromCatalogue[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const api = useApi();

    useEffect(() => {
        const search = async () => {
            if (debouncedSearchTerm.length < 2) { setResults([]); return; }
            setIsLoading(true);
            try {
                // CORRECTION: Remplacement de 'api.get' par 'api.post' et de 'catalogue' par 'search-products'
                const data = await api.post(`/quotes/search-products`, { term: debouncedSearchTerm, quote_type: quoteType });
                setResults(data.data || []);
            } catch (error) { console.error("Erreur recherche produit:", error); setResults([]); }
            finally { setIsLoading(false); }
        };
        search();
    }, [debouncedSearchTerm, api, quoteType]);
    
    return (
        <div className="mt-2 relative">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full p-2 border rounded" autoFocus />
            {isLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">...</div>}
            {results.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {results.map(product => (
                        <li key={`${product.product_type}-${product.id}`} onClick={() => onSelect(product)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <div className="font-bold">{product.internal_label || product.name}</div>
                            <div className="text-xs text-gray-500">{product.name} <span className="font-mono">({product.reference})</span></div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};