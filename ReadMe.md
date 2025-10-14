# **Documentation Technique \- RCS Client System**

* **Auteur** : Agis (Développeur Senior Full Stack)  
* **Date** : 08/10/2025  
* **Version** : 3.0

## **1\. Introduction**

Ce projet permet de suivre la base de clients gérés par RCS Europe. L'application centralise les informations des radios, leurs audiences, les logiciels qu'elles utilisent, leur appartenance à des groupements, et les données financières associées.

Cette version intègre un module complet de gestion de devis, un catalogue produits (avec add-ons), et une interface de gestion des grilles tarifaires.

## **2\. Installation**

### **2.1. Prérequis**

* **Node.js** (version 20.x ou supérieure)  
* **npm** (inclus avec Node.js)  
* **PostgreSQL** (version 17 ou supérieure)

### **2.2. Base de Données**

1. Créez une nouvelle base de données dans PostgreSQL.  
2. Importez le fichier Export\_DB.sql pour créer le schéma et insérer les données initiales.  
3. **Important** : Exécutez le script de mise à jour db\_update\_final.sql pour ajouter les tables et colonnes nécessaires aux nouvelles fonctionnalités (devis, tarifs, add-ons).

### **2.3. Fichiers du projet**

1. Placez les dossiers frontend et backend dans un répertoire de travail.  
2. Créez un fichier .env à la racine de backend/ en vous basant sur la section 2.4.

### **2.4. Variables d'Environnement**

Le fichier .env du backend doit contenir :

NODE\_ENV=development  
PORT=5000  
DB\_USER=crm\_user  
DB\_HOST=localhost  
DB\_NAME=crm\_platform  
DB\_PASSWORD=12h2oSt  
DB\_PORT=5432  
JWT\_SECRET=votre\_cle\_secrete\_tres\_longue\_et\_complexe  
NEXT\_PUBLIC\_GOOGLE\_MAPS\_API\_KEY="VOTRE\_CLÉ\_API\_ICI"

### **2.5. Installation des Dépendances**

Dans chaque dossier (frontend et backend), exécutez : npm install

### **2.6. Lancement des serveurs**

* **Frontend :** npm run dev  
* **Backend :** npm start

L'application sera accessible à http://localhost:3000.

## **3\. Technologies et Dépendances**

### **3.1. Frontend**

* **Framework** : Next.js 15.4  
* **Langage** : TypeScript  
* **Bibliothèques** : React 19.1, Recharts, Lucide React  
* **Styling** : Tailwind CSS

### **3.2. Backend**

* **Framework** : Express.js  
* **Base de Données** : PostgreSQL (avec pg)  
* **Bibliothèques** : bcryptjs, jsonwebtoken, multer, pdfkit

## **4\. Structure du Projet**

### **4.1. Frontend**

frontend/  
├── public/  
│   └── icons/  
├── src/  
│   ├── app/  
│   │   ├── account/  
│   │   │   └── page.tsx  
│   │   ├── analytics/  
│   │   │   └── page.tsx  
│   │   ├── clients/  
│   │   │   ├── \[id\]/  
│   │   │   │   └── page.tsx  
│   │   │   ├── nouveau/  
│   │   │   │   └── page.tsx  
│   │   │   └── page.tsx  
│   │   ├── login/  
│   │   │   └── page.tsx  
│   │   ├── parametres/  
│   │   │   ├── grilles-tarifaires/  
│   │   │   │   └── page.tsx  
│   │   │   ├── references/  
│   │   │   │   └── page.tsx  
│   │   │   └── page.tsx  
│   │   ├── quotes/  
│   │   │   ├── \[quoteId\]/  
│   │   │   │   └── page.tsx  
│   │   │   ├── nouveau/  
│   │   │   │   └── page.tsx  
│   │   │   └── page.tsx  
│   │   ├── users/  
│   │   │   └── page.tsx  
│   │   ├── globals.css  
│   │   ├── layout.tsx  
│   │   └── page.tsx  
│   ├── components/  
│   │   ├── clients/  
│   │   │   ├── ClientPageHeader.tsx  
│   │   │   └── ClientQuotesList.tsx  
│   │   ├── dashboard/  
│   │   │   ├── CommercialSummaryCard.tsx  
│   │   │   ├── DashboardStatCard.tsx  
│   │   │   ├── OngoingQuotesCard.tsx  
│   │   │   ├── RecentActivityCard.tsx  
│   │   │   ├── RevenueCard.tsx  
│   │   │   ├── SoftwareDistributionCard.tsx  
│   │   │   ├── TopClientsCard.tsx  
│   │   │   └── TopGroupsCard.tsx  
│   │   ├── users/  
│   │   │   └── UsersList.tsx  
│   │   ├── AudienceFormModal.tsx  
│   │   ├── ClientAudienceCard.tsx  
│   │   ├── ClientDetailsCard.tsx  
│   │   ├── ConfigServicesCard.tsx  
│   │   ├── ConfirmationModal.tsx  
│   │   ├── ContactsCard.tsx  
│   │   ├── DerniereAudienceCard.tsx  
│   │   ├── Header.tsx  
│   │   ├── LayoutWrapper.tsx  
│   │   ├── LogoUploader.tsx  
│   │   ├── Sidebar.tsx  
│   │   └── SizingCard.tsx  
│   ├── contexts/  
│   │   ├── AuthContext.tsx  
│   │   └── AuthProvider.tsx  
│   ├── hooks/  
│   │   ├── useApi.ts  
│   │   ├── useCRUDReferences.ts  
│   │   ├── useDebounce.ts  
│   │   └── useReferences.ts  
│   └── types/  
│       ├── client.ts  
│       └── index.ts  
├── next.config.ts  
├── postcss.config.js  
├── tailwind.config.ts  
└── tsconfig.json

### **4.2. Backend**

backend/  
├── config/  
│   └── database.js  
├── middleware/  
│   ├── auth.js  
│   └── roles.js  
├── public/  
│   └── uploads/  
│       └── logos/  
├── routes/  
│   ├── actions.js  
│   ├── analytics.js  
│   ├── audiences.js  
│   ├── auth.js  
│   ├── client-services.js  
│   ├── clients.js  
│   ├── contacts.js  
│   ├── dashboard.js  
│   ├── editeurs.js  
│   ├── groupements.js  
│   ├── logiciels.js  
│   ├── products.js  
│   ├── quotes.js  
│   ├── references.js  
│   ├── search.js  
│   ├── services.js  
│   ├── statuts-client.js  
│   ├── tarifs.js  
│   ├── types-diffusion.js  
│   ├── types-marche.js  
│   └── users.js  
├── utils/  
│   └── generateQuotePDF.js  
├── .env  
├── package.json  
└── server.js

### **4.3. Routes Clés de l'API**

* auth.js : Connexion et déconnexion.  
* users.js : CRUD des utilisateurs.  
* clients.js : CRUD complet des clients.  
* dashboard.js : Données agrégées pour le tableau de bord.  
* quotes.js : CRUD des devis, gestion des statuts, et génération PDF (/:id/pdf).  
* products.js : CRUD du catalogue produits, incluant les add-ons (filtrable via ?product\_type=ADDON).  
* **tarifs.js** : CRUD de la grille tarifaire pour les logiciels et services.  
* **groupements.js** : CRUD des groupements de radios.  
* references.js, etc. : Gestion des tables de référence.

## **5\. Base de Données**

### **5.1. Schéma Général**

La structure s'articule autour de la table clients. Les ajouts majeurs concernent le module de devis, le catalogue produits et les grilles tarifaires.

### **5.2. Tables Principales et Leurs Rôles**

* **clients** : Fiche d'identité de chaque radio.  
* **contacts** : Personnes de contact associées à un client.  
* **commercial\_actions** : Suivi des actions commerciales.  
* **users** : Comptes utilisateurs de l'application (admin, editor, viewer).  
* **ref\_\*** : Ensemble des tables de référence qui alimentent les listes déroulantes.

### **5.3. Nouvelles Tables et Évolutions**

* **products (Modifiée)**  
  * **Rôle** : Centralise les articles à prix fixe (Matériel, Formation) et les **add-ons**.  
  * **Champs clés** : is\_addon (boolean), addon\_rule (varchar), addon\_value (numeric), addon\_basis\_logiciel\_id, addon\_basis\_service\_id.  
* **ref\_tarifs\_grilles**  
  * **Rôle** : Table stratégique qui stocke les règles de prix dynamiques pour les logiciels et services d'abonnement.  
  * **Champs clés** : name, ref\_logiciel\_id, ref\_service\_id, audience\_min, audience\_max, prix\_mensuel\_ht.  
* **ref\_tva**  
  * **Rôle** : Gère les taux de TVA par pays.  
* **quotes, quote\_sections, quote\_items**  
  * **Rôle** : Structurent les devis. quote\_items est une "photographie" d'un produit au moment de la création pour garantir l'intégrité des données historiques.

## **6\. Scripts Utiles**

* npm run dev (frontend) : Lance le serveur de développement Next.js.  
* npm start (backend) : Lance le serveur Express.  
* npm run build (frontend) : Construit l'application Next.js pour la production.

## **7\. Fonctionnalités Clés**

* **Gestion des Clients** : CRUD complet.  
* **Module Devis** : Cycle de vie complet de la création à la gestion des statuts, avec génération de PDF bilingue (FR/EN).  
* **Gestion du Catalogue** : Interface d'administration pour les produits et les add-ons.  
* **Gestion de la Grille Tarifaire** : Interface dédiée pour manager les prix des logiciels et services en fonction du profil client.  
* **Tableau de Bord** : Vue d'ensemble avec KPIs, actions à venir et devis en cours.  
* **Authentification et Rôles** : Accès sécurisé avec 3 niveaux de permissions (viewer, editor, admin).

## **8\. Révisions**

* **08/10/2025 \- v3.0** : Mise à jour complète de la documentation pour refléter l'ajout des grilles tarifaires, de la logique des add-ons et de la structure de base de données finale. Arborescence du projet complétée.  
* **07/10/2025 \- v2.0** : Intégration de la documentation initiale pour les modules Devis et Catalogue.  
* **19/09/2025 \- v1.0** : Création initiale de la documentation technique.