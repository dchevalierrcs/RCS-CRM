// src/types/index.ts

// Ce fichier centralise tous les types de données partagés dans l'application.

export interface Contact {
  id?: number;
  nom: string;
  fonction?: string;
  telephone?: string;
  email?: string;
  est_contact_principal: boolean;
  roles: string[];
}

export interface Audience {
  id: number;
  client_id: number;
  vague_id: number;
  vague?: string;
  annee?: number;
  audience: number;
  created_at: string;
  type_audience_id: number;
  type_nom: string;
}

// --- AJOUT DU TYPE MANQUANT ---

// Interface pour un service souscrit par un client (table de liaison)
export interface ClientService {
  id?: number; // ID de l'entrée dans la table client_services
  client_id?: number;
  service_id: number;
  valeur_mensuelle: number | string; // Gère les entrées formulaire (string) et les données (number)
  
  // Données ajoutées côté client pour faciliter l'affichage
  nom: string;
  categorie: string;
  permet_plusieurs_instances: boolean;
}


// --- Types pour les Références ---

export interface StatutClient { id: number; code: string; nom: string; ordre_affichage: number; }
export interface Pays { id: number; code_iso: string; nom: string; }
export interface Logiciel { id: number; nom: string; type_logiciel: string; description?: string; editeur_id?: number; editeur?: string; }
export interface TypeMarche { id: number; nom: string; }
export interface TypeDiffusion { id: number; code: string; nom: string; }
export interface RoleContact { id: number; nom: string; code: string; }
export interface Groupement { id: number; nom: string; }
export interface Editeur { id: number; nom: string; }
export interface Service { id: number; nom: string; categorie: string; permet_plusieurs_instances: boolean; editeur_id: number | null; }
export interface TypeAudience { id: number; nom: string; }
export interface Vague { id: number; nom: string; annee: number; type_audience_id: number; }

// --- Interface Globale pour le Hook useReferences ---

export interface References {
  statuts_client: StatutClient[];
  pays: Pays[];
  logiciels: Logiciel[];
  types_marche: TypeMarche[];
  types_diffusion: TypeDiffusion[];
  roles_contact: RoleContact[];
  groupements: Groupement[];
  editeurs: Editeur[];
  services: Service[];
  types_audience: TypeAudience[];
  vagues: Vague[];
}

// --- AJOUTS POUR L'AUTHENTIFICATION ---

export interface User {
  id: number;
  nom: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}