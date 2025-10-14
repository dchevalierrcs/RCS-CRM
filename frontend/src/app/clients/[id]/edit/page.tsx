'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Building, Users, Settings, Wifi, Plus, Edit, Trash2, User, X, MapPin, ChevronDown, Import } from 'lucide-react'; // <-- Ajout de l'icône Import
import Link from 'next/link';
import { useReferences, useLogiciels } from '@/hooks/useReferences';
import { Contact } from '@/types';
import ServiceFormModal from '@/components/ServiceFormModal';
import ContactFormModal from '@/components/ContactFormModal';
import { useApi } from '@/hooks/useApi';
import ImportAddressModal from '@/components/ImportAddressModal'; // <-- Ajout de l'import du nouveau modal

// ... Les interfaces restent les mêmes ...
interface ClientService {
  id: number;
  client_id: number;
  service_id: number;
  description: string;
  valeur_mensuelle: number | string;
  nom: string;
  categorie: string;
  permet_plusieurs_instances: boolean;
}

interface ClientFormData {
  nom_radio: string;
  raison_sociale: string;
  nom_groupe: string;
  logo_url: string;
  adresse: string;
  pays: string;
  statut_client: string;
  rcs_id: string;
  groupement_id: number | null;
  type_marche: number | null;
  nb_departs_pub: number;
  nb_webradios: number;
  types_diffusion: (string | number)[];
  logiciel_programmation: string;
  logiciel_diffusion: string;
  logiciel_planification: string;
  streaming_provider: string;
  revenus_programmation_mensuel: number | string;
  revenus_diffusion_mensuel: number | string;
  revenus_planification_mensuel: number | string;
  revenus_streaming_mensuel: number | string;
}

const CountrySelect = ({ pays, selectedValue, onChange }: { pays: {id: number, nom: string}[], selectedValue: string, onChange: (value: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredPays = useMemo(() => 
    pays.filter(p => p.nom.toLowerCase().includes(searchTerm.toLowerCase()))
  , [pays, searchTerm]);

  const selectedCountryName = useMemo(() => 
    pays.find(p => p.nom === selectedValue)?.nom || ''
  , [pays, selectedValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  useEffect(() => {
    if (isOpen) {
      setSearchTerm(selectedCountryName);
    }
  }, [isOpen, selectedCountryName]);

  const handleSelect = (paysNom: string) => {
    onChange(paysNom);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : selectedCountryName}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Sélectionner un pays..."
          className="w-full px-3 py-2 border rounded-lg pr-10"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredPays.length > 0 ? (
            filteredPays.map((p) => (
              <li
                key={p.id}
                onClick={() => handleSelect(p.nom)}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
              >
                {p.nom}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500">Aucun pays trouvé</li>
          )}
        </ul>
      )}
    </div>
  );
};


export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const api = useApi();

  const { references, loading: loadingRefs, error: errorRefs } = useReferences();
  const { logiciels: logicielsProgrammation } = useLogiciels('programmation');
  const { logiciels: logicielsDiffusion } = useLogiciels('diffusion');
  const { logiciels: logicielsPlanification } = useLogiciels('planification');
  const { logiciels: streamingProviders } = useLogiciels('streaming');

  const [initialClientData, setInitialClientData] = useState<Partial<ClientFormData>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  
  const [services, setServices] = useState<ClientService[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ClientService | null>(null);
  const [savingService, setSavingService] = useState(false);

  // <-- NOUVEL ÉTAT POUR GÉRER LE MODAL D'IMPORT D'ADRESSE -->
  const [showImportAddressModal, setShowImportAddressModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<ClientFormData>();

  const fetchClientData = useCallback(async (clientId: string) => {
    if (!references) return;
    try {
      setLoadingData(true);
      setError(null);
      const clientData = await api.get(`/clients/${clientId}`);
      
      const profilData = clientData.profils_professionnels || clientData;
      const typeMarcheId = (references.types_marche ?? []).find(
        (tm: any) => tm.nom === profilData.type_marche
      )?.id || null;
      const diffusionIds = (clientData.types_diffusion || [])
        .map((diffusion: { id: number; nom: string }) => String(diffusion.id))
        .filter(Boolean);

      const formattedData = {
        ...clientData,
        groupement_id: clientData.groupement_id || null,
        type_marche: typeMarcheId,
        types_diffusion: diffusionIds,
        nb_departs_pub: Number(profilData.nb_departs_pub) || 0,
        nb_webradios: Number(profilData.nb_webradios) || 0,
        revenus_programmation_mensuel: Number(clientData.revenus_programmation_mensuel) || 0,
        revenus_diffusion_mensuel: Number(clientData.revenus_diffusion_mensuel) || 0,
        revenus_planification_mensuel: Number(clientData.revenus_planification_mensuel) || 0,
        revenus_streaming_mensuel: Number(clientData.revenus_streaming_mensuel) || 0,
      };
      setInitialClientData(formattedData);
      reset(formattedData);
      setContacts(clientData.contacts || []);
      setServices(clientData.services || []);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données du client');
    } finally {
      setLoadingData(false);
    }
  }, [api, references, reset]);

  useEffect(() => {
    const clientId = params.id as string;
    if (clientId && !loadingRefs && references) {
      fetchClientData(clientId);
    }
  }, [params.id, loadingRefs, references, fetchClientData]);
  
  const handleAddContact = () => { setEditingContact(null); setShowContactModal(true); };
  const handleEditContact = (contact: Contact) => { setEditingContact(contact); setShowContactModal(true); };

  const handleSaveContact = async (contactData: Contact) => {
    setSavingContact(true);
    setError(null);
    const isNew = !contactData.id;
    try {
        if (isNew) {
            await api.post('/contacts', { clientId: params.id, contactData });
        } else {
            await api.put(`/contacts/${contactData.id}`, contactData);
        }
        setShowContactModal(false);
        setEditingContact(null);
        await fetchClientData(params.id as string);
    } catch (err: any) { setError(err.message || 'Erreur de sauvegarde du contact.'); } finally { setSavingContact(false); }
  };
  
  const handleDeleteContact = async (contactId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
        setError(null);
        try {
            await api.del(`/contacts/${contactId}`);
            await fetchClientData(params.id as string);
        } catch (err: any) { setError(err.message || 'Erreur de suppression du contact.'); }
    }
  };

  const handleAddService = () => { setEditingService(null); setShowServiceModal(true); };
  const handleEditService = (service: ClientService) => { setEditingService(service); setShowServiceModal(true); };
  const handleCancelService = () => { setShowServiceModal(false); setEditingService(null); };
  
  const handleSaveService = async (serviceData: any) => {
    setSavingService(true);
    try {
      if (editingService) {
        await api.put(`/client-services/${editingService.id}`, serviceData);
      } else {
        await api.post('/client-services', { ...serviceData, client_id: params.id });
      }
      setShowServiceModal(false);
      setEditingService(null);
      if(params.id) await fetchClientData(params.id as string);
    } catch (err: any) { setError(err.message || 'Erreur lors de la sauvegarde du service'); }
    finally { setSavingService(false); }
  };
  
  const handleDeleteService = async (serviceInstanceId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await api.del(`/client-services/${serviceInstanceId}`);
        if(params.id) await fetchClientData(params.id as string);
      } catch (err: any) { setError(err.message || 'Erreur lors de la suppression du service'); }
    }
  };

  const parseCurrency = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        clientData: { 
          nom_radio: data.nom_radio, nom_groupe: data.nom_groupe, raison_sociale: data.raison_sociale, 
          adresse: data.adresse, pays: data.pays, statut_client: data.statut_client, rcs_id: data.rcs_id, 
          groupement_id: data.groupement_id ? Number(data.groupement_id) : null,
          revenus_programmation_mensuel: parseCurrency(data.revenus_programmation_mensuel),
          revenus_diffusion_mensuel: parseCurrency(data.revenus_diffusion_mensuel),
          revenus_planification_mensuel: parseCurrency(data.revenus_planification_mensuel),
          revenus_streaming_mensuel: parseCurrency(data.revenus_streaming_mensuel),
        },
        profilData: { 
          type_marche: data.type_marche ? Number(data.type_marche) : null, 
          nb_departs_pub: data.nb_departs_pub, nb_webradios: data.nb_webradios, 
          types_diffusion: Array.isArray(data.types_diffusion) ? data.types_diffusion.map(Number) : [],
        },
        configData: { 
          logiciel_programmation: data.logiciel_programmation, logiciel_diffusion: data.logiciel_diffusion,
          logiciel_planification: data.logiciel_planification, streaming_provider: data.streaming_provider,
        },
        contacts: contacts
      };
      
      await api.put(`/clients/${params.id}`, payload);
      router.push(`/clients/${params.id}`); 
      
    } catch (err: any) { 
      setError(err.message || 'Erreur lors de la modification du client'); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const formatRevenue = (amount: number | string | undefined | null): string => { const numAmount = Number(amount) || 0; return `${numAmount.toLocaleString('fr-FR')} €`; };
  const totalRevenuServices = services.reduce((sum, service) => sum + (Number(service.valeur_mensuelle) || 0), 0);
  
  const getTotalRevenue = () => { 
    const prog = parseCurrency(watch('revenus_programmation_mensuel'));
    const diff = parseCurrency(watch('revenus_diffusion_mensuel'));
    const plan = parseCurrency(watch('revenus_planification_mensuel'));
    const stream = parseCurrency(watch('revenus_streaming_mensuel'));
    return prog + diff + stream + plan + totalRevenuServices; 
  };
  
  const createSoftwareOptions = (logiciels: any[], savedValue: string | undefined | null) => { 
    const options = [...(logiciels || [])]; 
    if (savedValue && !options.some(opt => opt.nom === savedValue)) { 
      options.unshift({ id: savedValue, nom: `${savedValue} (Inactif)` }); 
    } 
    return options; 
  };
  
  const logicielsProgrammationOptions = useMemo(() => createSoftwareOptions([...logicielsProgrammation].sort((a, b) => a.nom.localeCompare(b.nom)), initialClientData.logiciel_programmation), [logicielsProgrammation, initialClientData]);
  const logicielsDiffusionOptions = useMemo(() => createSoftwareOptions([...logicielsDiffusion].sort((a, b) => a.nom.localeCompare(b.nom)), initialClientData.logiciel_diffusion), [logicielsDiffusion, initialClientData]);
  const logicielsPlanificationOptions = useMemo(() => createSoftwareOptions([...logicielsPlanification].sort((a, b) => a.nom.localeCompare(b.nom)), initialClientData.logiciel_planification), [logicielsPlanification, initialClientData]);
  const streamingProvidersOptions = useMemo(() => createSoftwareOptions([...streamingProviders].sort((a, b) => a.nom.localeCompare(b.nom)), initialClientData.streaming_provider), [streamingProviders, initialClientData]);

  // <-- NOUVELLE FONCTION POUR GÉRER L'ADRESSE SÉLECTIONNÉE -->
  const handleAddressImport = (address: string) => {
    setValue('adresse', address, { shouldValidate: true, shouldDirty: true });
    setShowImportAddressModal(false);
  };

  if (loadingData || loadingRefs) { return ( <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div><span className="ml-3 text-gray-600">Chargement...</span></div> ); }
  if (error || errorRefs) { return ( <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error || errorRefs}</div></div> ); }

  const nomGroupe = watch('nom_groupe');

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4"><Link href={`/clients/${params.id}`} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl"><ArrowLeft className="h-6 w-6" /></Link><div><h1 className="text-3xl font-bold text-gray-900">Modifier le Client</h1><p className="text-gray-600 mt-1">{watch('nom_radio')}</p></div></div>
        <button type="submit" form="client-edit-form" disabled={loading} className="btn-modern btn-primary"><Save className="w-4 h-4 mr-2" />{loading ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>
      <form id="client-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="dashboard-card"><div className="card-header"><h3 className="card-title font-bold text-xl flex items-center"><Building className="h-5 w-5 mr-3 text-blue-600" />Informations Générales</h3></div><div className="card-body grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nom *</label>
                <input type="text" {...register('nom_radio', { required: 'Le nom est obligatoire' })} onBlur={(e) => setValue('nom_radio', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg"/>
                {errors.nom_radio && <p className="mt-1 text-sm text-red-600">{errors.nom_radio.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Groupe</label>
                <input type="text" {...register('nom_groupe')} onBlur={(e) => setValue('nom_groupe', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg"/>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Raison sociale</label>
                <input type="text" {...register('raison_sociale')} onBlur={(e) => setValue('raison_sociale', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg"/>
            </div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">RCS ID</label><input type="text" {...register('rcs_id')} className="w-full px-3 py-2 border rounded-lg"/></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Statut *</label><select {...register('statut_client')} className="w-full px-3 py-2 border rounded-lg">{(references?.statuts_client ?? []).map((s: any) => <option key={s.id} value={s.code}>{s.nom}</option>)}</select></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Groupement</label><select {...register('groupement_id')} className="w-full px-3 py-2 border rounded-lg"><option value="">Aucun</option>{(references?.groupements ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.nom}</option>)}</select></div>
        </div></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card">
            <div className="card-header"><h3 className="card-title font-bold text-xl flex items-center"><MapPin className="h-5 w-5 mr-3 text-blue-600" />Adresse</h3></div>
            <div className="card-body space-y-4 mt-4">
              <div>
                {/* <-- MODIFICATION : AJOUT DU BOUTON D'IMPORT --> */}
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">Adresse</label>
                  {nomGroupe && (
                    <button 
                      type="button" 
                      onClick={() => setShowImportAddressModal(true)} 
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Import className="h-3 w-3 mr-1"/>
                      Importer du groupe
                    </button>
                  )}
                </div>
                <textarea {...register('adresse')} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pays</label>
                <CountrySelect 
                  pays={references?.pays ?? []}
                  selectedValue={watch('pays')}
                  onChange={(value) => setValue('pays', value, { shouldValidate: true })}
                />
                <input type="hidden" {...register('pays')} />
              </div>
            </div>
          </div>
          <div className="dashboard-card"><div className="card-header flex justify-between items-center"><h3 className="card-title font-bold text-xl flex items-center"><Users className="h-5 w-5 mr-3 text-blue-600" />Contacts</h3><button type="button" onClick={handleAddContact} className="text-blue-600 hover:text-blue-800 text-sm flex items-center"><Plus className="h-4 w-4 mr-1" />Ajouter</button></div><div className="card-body mt-4">{contacts.length > 0 ? (<div className="space-y-3">{contacts.map((contact, index) => (<ContactFormCard key={contact.id || index} contact={contact} onEdit={() => handleEditContact(contact)} onDelete={() => handleDeleteContact(contact.id!)} references={references} />))}</div>) : (<div className="text-center py-4 bg-gray-50 rounded-lg"><User className="h-8 w-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-400 text-sm">Aucun contact</p></div>)}</div></div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header"><h3 className="card-title font-bold text-xl flex items-center"><Wifi className="h-5 w-5 mr-3 text-blue-600" />Dimensionnement</h3></div>
          <div className="card-body mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Type marché</label>
                  <select {...register('type_marche')} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Sélectionner...</option>
                    {(references?.types_marche ?? []).map((tm: any) => <option key={tm.id} value={tm.id}>{tm.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Départs pub</label>
                  <input type="number" {...register('nb_departs_pub', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Webradios</label>
                  <input type="number" {...register('nb_webradios', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Types de diffusion</label>
                <div className="grid grid-cols-2 gap-3">
                  {(references?.types_diffusion ?? []).map((td: any) => (
                    <label key={td.id} className="flex items-center">
                      <input type="checkbox" value={td.id} {...register('types_diffusion')} className="w-4 h-4" />
                      <span className="ml-2 text-sm">{td.nom}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title font-bold text-xl flex items-center"><Settings className="h-5 w-5 mr-3 text-purple-600" />Informations Techniques</h3>
            <div className="font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">{formatRevenue(getTotalRevenue())}/mois</div>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Programmation</label>
                <div className="grid grid-cols-2 gap-2">
                  <select {...register('logiciel_programmation')} className="w-full p-2 border rounded-lg">
                    <option value="">Sélectionner...</option>
                    {logicielsProgrammationOptions.map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                  </select>
                  <input type="text" inputMode="decimal" {...register('revenus_programmation_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Diffusion</label>
                <div className="grid grid-cols-2 gap-2">
                  <select {...register('logiciel_diffusion')} className="w-full p-2 border rounded-lg">
                    <option value="">Sélectionner...</option>
                    {logicielsDiffusionOptions.map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                  </select>
                  <input type="text" inputMode="decimal" {...register('revenus_diffusion_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Planification</label>
                <div className="grid grid-cols-2 gap-2">
                  <select {...register('logiciel_planification')} className="w-full p-2 border rounded-lg">
                    <option value="">Sélectionner...</option>
                    {logicielsPlanificationOptions.map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                  </select>
                  <input type="text" inputMode="decimal" {...register('revenus_planification_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Streaming</label>
                <div className="grid grid-cols-2 gap-2">
                  <select {...register('streaming_provider')} className="w-full p-2 border rounded-lg">
                    <option value="">Sélectionner...</option>
                    {streamingProvidersOptions.map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                  </select>
                  <input type="text" inputMode="decimal" {...register('revenus_streaming_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">Services Souscrits</h4>
                  <button type="button" onClick={handleAddService} className="text-blue-600 hover:text-blue-800 text-sm flex items-center"><Plus className="h-4 w-4 mr-1" />Ajouter</button>
                </div>
                <div className="space-y-2">
                  {services.length > 0 ? services.map(s => (<div key={s.id} className="bg-gray-50 p-2 rounded-md flex justify-between items-center text-sm"><div><p className="font-medium text-gray-900">{s.nom}</p>{s.description && <p className="text-xs text-gray-500">{s.description}</p>}</div><div className="flex items-center space-x-2"><span className="font-semibold text-gray-700">{formatRevenue(s.valeur_mensuelle)}</span><button type="button" onClick={() => handleEditService(s)} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="h-3 w-3"/></button><button type="button" onClick={() => handleDeleteService(s.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3"/></button></div></div>)) : <p className="text-xs text-gray-400 text-center py-2">Aucun service.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ... Modals ... */}
      {showContactModal && (<ContactFormModal contact={editingContact} onSave={handleSaveContact} onCancel={() => { setShowContactModal(false); setEditingContact(null); }} saving={savingContact} clientName={watch('nom_radio')} references={references}/>)}
      {showServiceModal && (<ServiceFormModal service={editingService} onSave={handleSaveService} onCancel={handleCancelService} saving={savingService} availableServices={(references?.services ?? [])} clientServices={services || []} />)}
      
      {/* <-- AFFICHAGE CONDITIONNEL DU NOUVEAU MODAL --> */}
      {showImportAddressModal && nomGroupe && (
        <ImportAddressModal 
          groupName={nomGroupe}
          currentClientId={params.id as string}
          onAddressSelect={handleAddressImport}
          onClose={() => setShowImportAddressModal(false)}
        />
      )}
    </div>
  );
}

function ContactFormCard({ contact, onEdit, onDelete, references }: { contact: Contact; onEdit: () => void; onDelete: () => void; references: any; }) {
  const roleLabels = useMemo(() => {
    if (!references?.roles_contact) return {};
    return (references.roles_contact ?? []).reduce((acc: any, role: any) => {
      acc[role.code] = role.nom;
      return acc;
    }, {});
  }, [references]);

  return ( 
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="font-medium text-gray-900">{contact.nom}</p>
            {contact.est_contact_principal && <span className="badge-blue">Principal</span>}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {(contact.roles ?? []).map((roleCode, index) => (
              <span key={index} className={`badge text-xs px-2 py-0.5`}>
                {roleLabels[roleCode] ?? roleCode}
              </span>
            ))}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            {contact.telephone && <p>📞 {contact.telephone}</p>}
            {contact.email && <p>✉️ {contact.email}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button type="button" onClick={onEdit} className="p-1"><Edit className="h-3 w-3" /></button>
          <button type="button" onClick={onDelete} className="p-1"><Trash2 className="h-3 w-3" /></button>
        </div>
      </div>
    </div> 
  );
}