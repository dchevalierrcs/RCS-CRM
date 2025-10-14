'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Building, Users, Settings, Wifi, AlertCircle, Plus, Edit, Trash2, User, X, MapPin, Import, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useReferences, useLogiciels } from '@/hooks/useReferences';
import ContactFormModal from '@/components/ContactFormModal';
import ServiceFormModal from '@/components/ServiceFormModal';
// --- MODIFICATION : Importation des types corrects ---
import { Contact, ClientService, Service } from '@/types'; 
import { useApi } from '@/hooks/useApi';
import ImportAddressModal from '@/components/ImportAddressModal';

// --- MODIFICATION : L'interface locale ClientService a été SUPPRIMÉE ---

interface ClientFormData {
  nom_radio: string;
  raison_sociale: string;
  nom_groupe: string;
  adresse: string;
  pays: string;
  statut_client: string;
  rcs_id: string;
  groupement_id: number | null;
  type_marche: number | null;
  nb_departs_pub: number;
  nb_webradios: number;
  types_diffusion: number[];
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


export default function NouveauClientPage() {
  const router = useRouter();
  const api = useApi();
  
  const { references, loading: loadingRefs, error: errorRefs } = useReferences();
  const { logiciels: logicielsProgrammation } = useLogiciels('programmation');
  const { logiciels: logicielsDiffusion } = useLogiciels('diffusion');
  const { logiciels: logicielsPlanification } = useLogiciels('planification');
  const { logiciels: streamingProviders } = useLogiciels('streaming');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);

  const [showImportAddressModal, setShowImportAddressModal] = useState(false);

  // --- MODIFICATION : Le state utilise maintenant le type ClientService importé ---
  const [services, setServices] = useState<ClientService[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ClientService | null>(null);
  const [savingService, setSavingService] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClientFormData>({
    defaultValues: {
      pays: 'France',
      statut_client: 'Client',
      nb_departs_pub: 0,
      nb_webradios: 0,
      revenus_programmation_mensuel: 0,
      revenus_diffusion_mensuel: 0,
      revenus_planification_mensuel: 0,
      revenus_streaming_mensuel: 0,
      groupement_id: null,
      type_marche: null,
      types_diffusion: [],
    }
  });
  
  const nomGroupe = watch('nom_groupe');

  const handleAddressImport = (address: string) => {
    setValue('adresse', address, { shouldValidate: true, shouldDirty: true });
    setShowImportAddressModal(false);
  };

  const handleAddContact = () => { setEditingContactIndex(null); setShowContactModal(true); };
  const handleEditContact = (index: number) => { setEditingContactIndex(index); setShowContactModal(true); };
  const handleDeleteContact = (index: number) => { setContacts(contacts.filter((_, i) => i !== index)); };
  const handleSaveContact = (contactData: Contact) => {
    if (editingContactIndex !== null) {
      const updatedContacts = [...contacts];
      updatedContacts[editingContactIndex] = contactData;
      setContacts(updatedContacts);
    } else {
      setContacts([...contacts, contactData]);
    }
    setShowContactModal(false);
    setEditingContactIndex(null);
  };

  // --- MODIFICATION : Fonctions de gestion des services corrigées ---
  const handleAddService = () => { setEditingService(null); setShowServiceModal(true); };
  const handleEditService = (service: ClientService) => { setEditingService(service); setShowServiceModal(true); };
  const handleSaveService = (serviceData: ClientService) => {
    setSavingService(true);
    // La donnée reçue du modal est déjà un objet ClientService complet
    if (editingService) {
        setServices(services.map(s => s.service_id === editingService.service_id ? serviceData : s));
    } else {
        setServices([...services, serviceData]);
    }
    setShowServiceModal(false);
    setEditingService(null);
    setSavingService(false);
  };
  const handleDeleteService = (service_id: number) => {
    setServices(services.filter(s => s.service_id !== service_id));
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
          nom_radio: data.nom_radio.toUpperCase(),
          nom_groupe: data.nom_groupe ? data.nom_groupe.toUpperCase() : '',
          raison_sociale: data.raison_sociale ? data.raison_sociale.toUpperCase() : '',
          adresse: data.adresse,
          pays: data.pays,
          statut_client: data.statut_client,
          rcs_id: data.rcs_id ? data.rcs_id : null,
          groupement_id: data.groupement_id ? Number(data.groupement_id) : null,
          revenus_programmation_mensuel: parseCurrency(data.revenus_programmation_mensuel),
          revenus_diffusion_mensuel: parseCurrency(data.revenus_diffusion_mensuel),
          revenus_planification_mensuel: parseCurrency(data.revenus_planification_mensuel),
          revenus_streaming_mensuel: parseCurrency(data.revenus_streaming_mensuel),
        },
        profilData: {
          type_marche: data.type_marche ? Number(data.type_marche) : null,
          nb_departs_pub: data.nb_departs_pub,
          nb_webradios: data.nb_webradios,
          types_diffusion: Array.isArray(data.types_diffusion) ? data.types_diffusion.map(Number) : [],
        },
        configData: {
          logiciel_programmation: data.logiciel_programmation,
          logiciel_diffusion: data.logiciel_diffusion,
          logiciel_planification: data.logiciel_planification,
          streaming_provider: data.streaming_provider,
        },
        contacts: contacts,
        services: services.map(s => ({
          service_id: s.service_id,
          valeur_mensuelle: parseCurrency(s.valeur_mensuelle)
        })),
      };
      
      const newClient = await api.post('/clients', payload);

      if (newClient && newClient.id) {
        router.push(`/clients/${newClient.id}`);
      } else {
        throw new Error('La création a échoué ou l\'ID du nouveau client n\'a pas été retourné.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion lors de la création du client');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenuServices = services.reduce((sum, service) => sum + parseCurrency(service.valeur_mensuelle), 0);

  const getTotalRevenue = () => { 
    const prog = parseCurrency(watch('revenus_programmation_mensuel'));
    const diff = parseCurrency(watch('revenus_diffusion_mensuel'));
    const plan = parseCurrency(watch('revenus_planification_mensuel'));
    const stream = parseCurrency(watch('revenus_streaming_mensuel'));
    return prog + diff + plan + stream + totalRevenuServices;
  };
  const formatRevenue = (amount: number) => `${amount.toLocaleString('fr-FR')} €`;

  if (loadingRefs) { return <div className="p-6">Chargement des références...</div>; }
  if (errorRefs) { return <div className="p-6 text-red-600">Erreur: {errorRefs}</div>; }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/clients" className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl"><ArrowLeft className="h-6 w-6" /></Link>
          <div><h1 className="text-3xl font-bold text-gray-900">Nouveau Client</h1><p className="text-gray-600 mt-1">Ajouter un nouveau client à la base de données</p></div>
        </div>
      </div>

      {error && ( <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"><AlertCircle className="h-5 w-5 mr-2" /><span>{error}</span><button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button></div> )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Informations Générales */}
        <div className="dashboard-card"><div className="card-header"><h3 className="card-title font-bold text-xl flex items-center"><Building className="h-5 w-5 mr-3 text-blue-600" />Informations Générales</h3></div><div className="card-body mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Nom de la radio *</label><input type="text" {...register('nom_radio', { required: 'Le nom est obligatoire' })} onBlur={(e) => setValue('nom_radio', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg"/>{errors.nom_radio && <p className="mt-1 text-sm text-red-600">{errors.nom_radio.message}</p>}</div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Groupe</label><input type="text" {...register('nom_groupe')} onBlur={(e) => setValue('nom_groupe', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg"/></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Raison sociale</label><input type="text" {...register('raison_sociale')} onBlur={(e) => setValue('raison_sociale', e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg"/></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">RCS ID</label><input type="text" {...register('rcs_id')} className="w-full px-3 py-2 border rounded-lg"/></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Statut Client *</label><select {...register('statut_client', { required: true })} className="w-full px-3 py-2 border rounded-lg">{(references?.statuts_client ?? []).map((s: any) => (<option key={s.id} value={s.code}>{s.nom}</option>))}</select></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-2">Groupement</label><select {...register('groupement_id')} className="w-full px-3 py-2 border rounded-lg"><option value="">Aucun</option>{(references?.groupements ?? []).map((g: any) => (<option key={g.id} value={g.id}>{g.nom}</option>))}</select></div>
        </div></div>

        {/* Adresse et Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dashboard-card">
                <div className="card-header"><h3 className="card-title font-bold text-xl flex items-center"><MapPin className="h-5 w-5 mr-3 text-blue-600" />Adresse</h3></div>
                <div className="card-body mt-4 space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-bold text-gray-700">Adresse</label>
                          {nomGroupe && (<button type="button" onClick={() => setShowImportAddressModal(true)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center"><Import className="h-3 w-3 mr-1"/>Importer du groupe</button>)}
                        </div>
                        <textarea {...register('adresse')} rows={3} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pays</label>
                        <CountrySelect pays={references?.pays ?? []} selectedValue={watch('pays')} onChange={(value) => setValue('pays', value, { shouldValidate: true })} />
                        <input type="hidden" {...register('pays')} />
                    </div>
                </div>
            </div>
            <div className="dashboard-card"><div className="card-header flex justify-between items-center"><h3 className="card-title font-bold text-xl flex items-center"><Users className="h-5 w-5 mr-3 text-blue-600" />Contacts</h3><button type="button" onClick={handleAddContact} className="text-blue-600 hover:text-blue-800 text-sm flex items-center"><Plus className="h-4 w-4 mr-1" />Ajouter</button></div><div className="card-body mt-4">{contacts.length > 0 ? (<div className="space-y-3">{contacts.map((contact, index) => (<ContactFormCard key={index} contact={contact} onEdit={() => handleEditContact(index)} onDelete={() => handleDeleteContact(index)} />))}</div>) : (<div className="text-center py-4 bg-gray-50 rounded-lg"><User className="h-8 w-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-400 text-sm">Aucun contact</p></div>)}</div></div>
        </div>
        
        {/* Dimensionnement */}
        <div className="dashboard-card"><div className="card-header"><h3 className="card-title font-bold text-xl flex items-center"><Wifi className="h-5 w-5 mr-3 text-blue-600" />Dimensionnement</h3></div><div className="card-body mt-4"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="space-y-6"><div><label className="block text-sm font-bold text-gray-700 mb-2">Type marché</label><select {...register('type_marche')} className="w-full px-3 py-2 border rounded-lg"><option value="">Sélectionner...</option>{(references?.types_marche ?? []).map((tm: any) => <option key={tm.id} value={tm.id}>{tm.nom}</option>)}</select></div><div><label className="block text-sm font-bold text-gray-700 mb-2">Départs pub</label><input type="number" {...register('nb_departs_pub', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm font-bold text-gray-700 mb-2">Webradios</label><input type="number" {...register('nb_webradios', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-lg" /></div></div><div><label className="block text-sm font-bold text-gray-700 mb-3">Types de diffusion</label><div className="grid grid-cols-2 gap-3">{(references?.types_diffusion ?? []).map((td: any) => (<label key={td.id} className="flex items-center"><input type="checkbox" value={td.id} {...register('types_diffusion')} className="w-4 h-4" /><span className="ml-2 text-sm">{td.nom}</span></label>))}</div></div></div></div></div>

        {/* Informations Techniques */}
        <div className="dashboard-card">
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title font-bold text-xl flex items-center"><Settings className="h-5 w-5 mr-3 text-purple-600" />Informations Techniques</h3>
            <div className="font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">{formatRevenue(getTotalRevenue())}/mois</div>
          </div>
          <div className="card-body mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Programmation</label><div className="grid grid-cols-2 gap-2"><select {...register('logiciel_programmation')} className="w-full p-2 border rounded-lg"><option value="">Sélectionner...</option>{logicielsProgrammation.sort((a, b) => a.nom.localeCompare(b.nom)).map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}</select><input type="text" inputMode="decimal" {...register('revenus_programmation_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" /></div></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Diffusion</label><div className="grid grid-cols-2 gap-2"><select {...register('logiciel_diffusion')} className="w-full p-2 border rounded-lg"><option value="">Sélectionner...</option>{logicielsDiffusion.sort((a, b) => a.nom.localeCompare(b.nom)).map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}</select><input type="text" inputMode="decimal" {...register('revenus_diffusion_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" /></div></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Planification</label><div className="grid grid-cols-2 gap-2"><select {...register('logiciel_planification')} className="w-full p-2 border rounded-lg"><option value="">Sélectionner...</option>{logicielsPlanification.sort((a, b) => a.nom.localeCompare(b.nom)).map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}</select><input type="text" inputMode="decimal" {...register('revenus_planification_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" /></div></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Streaming</label><div className="grid grid-cols-2 gap-2"><select {...register('streaming_provider')} className="w-full p-2 border rounded-lg"><option value="">Sélectionner...</option>{streamingProviders.sort((a, b) => a.nom.localeCompare(b.nom)).map((l: any) => <option key={l.id} value={l.nom}>{l.nom}</option>)}</select><input type="text" inputMode="decimal" {...register('revenus_streaming_mensuel')} placeholder="Revenus (€/mois)" className="w-full p-2 border rounded-lg" /></div></div>
            </div>
            {/* Section Services Souscrits */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">Services Souscrits</h4>
                  <button type="button" onClick={handleAddService} className="text-blue-600 hover:text-blue-800 text-sm flex items-center"><Plus className="h-4 w-4 mr-1" />Ajouter</button>
                </div>
                <div className="space-y-2">
                  {services.length > 0 ? services.map(s => (<div key={s.service_id} className="bg-gray-50 p-2 rounded-md flex justify-between items-center text-sm"><div><p className="font-medium text-gray-900">{s.nom}</p></div><div className="flex items-center space-x-2"><span className="font-semibold text-gray-700">{formatRevenue(parseCurrency(s.valeur_mensuelle))}</span><button type="button" onClick={() => handleEditService(s)} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="h-3 w-3"/></button><button type="button" onClick={() => handleDeleteService(s.service_id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3"/></button></div></div>)) : <p className="text-xs text-gray-400 text-center py-2">Aucun service.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t"><Link href="/clients" className="btn-modern btn-secondary">Annuler</Link><button type="submit" disabled={loading} className="btn-modern btn-primary">{loading ? 'Création...' : <><Save className="w-4 h-4 mr-2" />Créer le Client</>}</button></div>
      </form>
      
      {showContactModal && ( <ContactFormModal contact={editingContactIndex !== null ? contacts[editingContactIndex] : null} onSave={handleSaveContact} onCancel={() => { setShowContactModal(false); setEditingContactIndex(null); }} clientName={watch('nom_radio')} references={references} saving={false} /> )}
      {showImportAddressModal && nomGroupe && (<ImportAddressModal groupName={nomGroupe} currentClientId="" onAddressSelect={handleAddressImport} onClose={() => setShowImportAddressModal(false)}/>)}
      
      {/* --- MODIFICATION : Appel à ServiceFormModal corrigé --- */}
      {showServiceModal && (<ServiceFormModal service={editingService} onSave={handleSaveService} onCancel={() => {setShowServiceModal(false); setEditingService(null);}} saving={savingService} references={{ services: references?.services ?? [] }} clientServices={services || []} />)}
    </div>
  );
}

function ContactFormCard({ contact, onEdit, onDelete }: { contact: Contact; onEdit: () => void; onDelete: () => void; }) {
    // Note : Cette section peut être améliorée pour utiliser les rôles dynamiques des références
  const roleLabels: { [key: string]: string } = { 'direction_generale': 'Direction Générale', 'direction_technique': 'Direction Technique', 'direction_programmes': 'Direction des Programmes', 'programmateur_musical': 'Programmateur Musical', 'contact_principal': 'Contact Principal' };
  return ( <div className="bg-gray-50 rounded-lg p-3"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center space-x-2 mb-1"><p className="font-medium text-gray-900">{contact.nom}</p>{contact.est_contact_principal && <span className="badge-blue">Principal</span>}</div><div className="flex flex-wrap gap-1 mb-2">{(contact.roles ?? []).map((role, index) => (<span key={index} className={`badge text-xs px-2 py-0.5`}>{roleLabels[role] ?? role}</span>))}</div><div className="space-y-1 text-sm text-gray-600">{contact.telephone && <p>📞 {contact.telephone}</p>}{contact.email && <p>✉️ {contact.email}</p>}</div></div><div className="flex items-center space-x-1 ml-2"><button type="button" onClick={onEdit} className="p-1"><Edit className="h-3 w-3" /></button><button type="button" onClick={onDelete} className="p-1"><Trash2 className="h-3 w-3" /></button></div></div></div> );
}