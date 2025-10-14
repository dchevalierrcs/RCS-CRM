// ===============================================
// TYPES CLIENT - VERSION SANS CODAGE EN DUR
// ===============================================

// Types de base (suppression des unions codées en dur)
export type StatutClient = string; // Maintenant récupéré depuis la base

// Interface Client principal
export interface Client {
  id: number;
  nom_radio: string;
  nom_groupe?: string;
  raison_sociale?: string;
  adresse?: string;
  pays?: string;
  statut_client: StatutClient;
  id_interne?: string;
  logo_url?: string;
  
  // Revenus
  revenus_programmation_mensuel?: number;
  revenus_publicite_mensuel?: number;
  revenus_autres_mensuel?: number;
  
  // Informations techniques (maintenant récupérées depuis les références)
  logiciel_programmation?: string;
  logiciel_diffusion?: string;
  logiciel_planification?: string;
  type_marche?: string;
  type_diffusion?: string[];
  
  // Métadonnées
  created_at?: string;
  updated_at?: string;
}

// Interface pour les détails client avec relations
export interface ClientDetail extends Client {
  audiences?: Audience[];
  contacts?: Contact[];
  responsables?: Responsable[];
}

// Interface Audience
export interface Audience {
  id: number;
  client_id: number;
  vague: string;
  audience?: number;
  annee_debut?: number;
  annee_fin?: number;
  created_at?: string;
}

// Interface Contact (avec rôle depuis les références)
export interface Contact {
  id: number;
  client_id: number;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  role?: string; // Maintenant récupéré depuis ref_roles_contact
  created_at?: string;
  updated_at?: string;
}

// Interface Responsable
export interface Responsable {
  id: number;
  client_id: number;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  created_at?: string;
  updated_at?: string;
}

// Types pour les formulaires
export interface ClientFormData {
  nom_radio: string;
  nom_groupe?: string;
  raison_sociale?: string;
  adresse?: string;
  pays?: string;
  statut_client: StatutClient;
  id_interne?: string;
  
  // Revenus
  revenus_programmation_mensuel?: number;
  revenus_publicite_mensuel?: number;
  revenus_autres_mensuel?: number;
  
  // Informations techniques
  logiciel_programmation?: string;
  logiciel_diffusion?: string;
  logiciel_planification?: string;
  type_marche?: string;
  type_diffusion?: string[];
}

// Types pour les filtres de recherche
export interface ClientFilters {
  statut?: StatutClient;
  pays?: string;
  type_marche?: string;
  recherche?: string;
}
