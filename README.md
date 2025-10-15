# **Documentation Technique \- RCS Client System**

## **1\. Introduction**

RCS Client System est une application conçue pour suivre et gérer la base de clients de RCS Europe. Elle centralise les informations essentielles sur les radios, incluant leurs audiences, les logiciels RCS qu'elles utilisent, leur affiliation à des groupements, ainsi que les données financières associées. L'application offre également des fonctionnalités pour maintenir des grilles tarifaires à jour et pour générer des devis.

## **2\. Installation**

### **2.1. Prérequis**

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :

* **Node.js** : version 20.x ou supérieure.  
* **npm** : inclus avec l'installation de Node.js.  
* **PostgreSQL** : version 17 ou supérieure.

### **2.2. Récupération du projet**

1. Ouvrez un terminal et clonez le dépôt Git :  
   git clone \[https://github.com/dchevalierrcs/RCS-CRM\](https://github.com/dchevalierrcs/RCS-CRM)

2. Naviguez dans le dossier du projet nouvellement créé :  
   cd RCS-CRM

### **2.3. Installation des dépendances**

Le projet est divisé en deux parties : un backend et un frontend.

1. **Backend** : Placez-vous dans le dossier backend et installez les dépendances :  
   cd backend  
   npm install

2. **Frontend** : Placez-vous dans le dossier frontend (depuis la racine du projet) et installez les dépendances :  
   cd frontend  
   npm install

## **3\. Configuration de l'environnement**

### **3.1. Configuration du Backend**

1. À la racine du dossier backend, créez un fichier nommé .env.  
2. Copiez-collez le contenu suivant dans ce fichier et adaptez les valeurs si nécessaire :  
   NODE\_ENV=development  
   PORT=5000  
   DB\_USER=crm\_user  
   DB\_HOST=localhost  
   DB\_NAME=crm\_platform  
   DB\_PASSWORD=12h2oSt  
   DB\_PORT=5432  
   JWT\_SECRET=votre\_cle\_secrete\_tres\_longue\_et\_complexe

### **3.2. Configuration du Frontend**

1. À la racine du dossier frontend, créez un fichier nommé .env.local.  
2. Copiez-collez le contenu suivant et remplacez VOTRE\_CLÉ\_API\_ICI par votre clé Google Maps :  
   NEXT\_PUBLIC\_GOOGLE\_MAPS\_API\_KEY="VOTRE\_CLÉ\_API\_ICI"

### **3.3. Création de la base de données**

1. Ouvrez un terminal psql pour interagir avec PostgreSQL.  
2. Exécutez les commandes suivantes pour créer l'utilisateur et la base de données :  
   CREATE USER crm\_user WITH PASSWORD '12h2oSt';  
   CREATE DATABASE crm\_platform OWNER crm\_user;

3. Une fois la base de données créée, vous pouvez importer le schéma fourni dans le fichier Export\_DB\_Complet.sql pour créer toutes les tables et structures nécessaires.

## **4\. Technologies et Dépendances**

### **4.1. Backend**

* **Framework principal** : Express.js  
* **Base de données** : PostgreSQL (avec le client pg)  
* **Authentification** : jsonwebtoken (JWT) pour les sessions, bcryptjs pour le hachage des mots de passe.  
* **Sécurité** : helmet pour la sécurisation des en-têtes HTTP, cors pour la gestion des accès inter-domaines.  
* **Gestion des fichiers** : multer pour les uploads, pdfkit pour la génération de PDF.  
* **Utilitaires** : dotenv, morgan, cookie-parser.  
* **Développement** : nodemon pour le rechargement automatique.

### **4.2. Frontend**

* **Framework principal** : Next.js (basé sur React)  
* **Langage** : TypeScript  
* **Styling** : Tailwind CSS  
* **Appels API** : Axios  
* **Gestion de formulaires** : React Hook Form avec Yup pour la validation.  
* **Composants d'UI** :  
  * **Icônes** : Lucide React  
  * **Graphiques** : Recharts  
  * **Cartes** : React Google Maps API

## **5\. Base de Données**

Cette section décrit la structure de la base de données PostgreSQL crm\_platform.

### **5.1. Schéma des tables**

Voici les définitions CREATE TABLE pour les principales tables de l'application.

\<details\>  
\<summary\>Cliquez pour voir le schéma SQL complet\</summary\>  
\--  
\-- PostgreSQL database dump  
\--

\-- Dumped from database version 17.6  
\-- Dumped by pg\_dump version 17.6

SET statement\_timeout \= 0;  
SET lock\_timeout \= 0;  
SET idle\_in\_transaction\_session\_timeout \= 0;  
SET client\_encoding \= 'UTF8';  
SET standard\_conforming\_strings \= on;  
SELECT pg\_catalog.set\_config('search\_path', '', false);  
SET check\_function\_bodies \= false;  
SET xmloption \= content;  
SET client\_min\_messages \= warning;  
SET row\_security \= off;

CREATE TYPE public.statut\_client AS ENUM (  
    'Client',  
    'Prospect',  
    'Non Client'  
);

CREATE TYPE public.user\_role AS ENUM (  
    'viewer',  
    'editor',  
    'admin'  
);

CREATE FUNCTION public.clean\_audience\_number(input\_text text) RETURNS integer  
    LANGUAGE plpgsql  
    AS $$  
BEGIN  
    IF input\_text IS NULL OR TRIM(input\_text) \= '' OR UPPER(TRIM(input\_text)) \= 'ND' THEN  
        RETURN NULL;  
    END IF;  
    RETURN CAST(REPLACE(TRIM(input\_text), ' ', '') AS INTEGER);  
EXCEPTION   
    WHEN OTHERS THEN  
        RETURN NULL;  
END;  
$$;

CREATE FUNCTION public.update\_updated\_at\_column() RETURNS trigger  
    LANGUAGE plpgsql  
    AS $$  
BEGIN  
   NEW.updated\_at \= NOW();  
   RETURN NEW;  
END;  
$$;

SET default\_tablespace \= '';

SET default\_table\_access\_method \= heap;

CREATE TABLE public.audiences (  
    id integer NOT NULL,  
    client\_id integer,  
    audience integer,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP,  
    type\_audience\_id integer NOT NULL,  
    vague\_id integer NOT NULL  
);

CREATE TABLE public.client\_services (  
    id integer NOT NULL,  
    client\_id integer NOT NULL,  
    service\_id integer NOT NULL,  
    description text,  
    valeur\_mensuelle numeric(10,2) DEFAULT 0.00,  
    created\_at timestamp with time zone DEFAULT CURRENT\_TIMESTAMP,  
    updated\_at timestamp with time zone DEFAULT CURRENT\_TIMESTAMP  
);

CREATE TABLE public.clients (  
    id integer NOT NULL,  
    nom\_radio character varying(255) NOT NULL,  
    nom\_groupe character varying(255),  
    logo\_url character varying(500),  
    adresse text,  
    pays character varying(100),  
    rcs\_id character varying(50),  
    created\_at timestamp without time zone DEFAULT now(),  
    updated\_at timestamp without time zone DEFAULT now(),  
    raison\_sociale character varying(255),  
    statut\_client public.statut\_client DEFAULT 'Client'::public.statut\_client NOT NULL,  
    revenus\_programmation\_mensuel numeric(10,2),  
    revenus\_diffusion\_mensuel numeric(10,2),  
    revenus\_planification\_mensuel numeric(10,2),  
    revenus\_streaming\_mensuel numeric(10,2),  
    revenus\_programmation\_annuel numeric(10,2),  
    revenus\_diffusion\_annuel numeric(10,2),  
    revenus\_planification\_annuel numeric(10,2),  
    revenus\_streaming\_annuel numeric(10,2),  
    revenus\_zetta\_cloud\_annuel numeric(10,2),  
    revenus\_autres\_annuel numeric(10,2),  
    groupement\_id integer  
);

CREATE TABLE public.commercial\_actions (  
    id integer NOT NULL,  
    client\_id integer NOT NULL,  
    user\_id integer NOT NULL,  
    action\_type character varying(50) NOT NULL,  
    subject character varying(255),  
    details text,  
    action\_date timestamp with time zone NOT NULL,  
    follow\_up\_date date,  
    status character varying(50) DEFAULT 'Terminé'::character varying,  
    created\_at timestamp with time zone DEFAULT now(),  
    updated\_at timestamp with time zone DEFAULT now()  
);

CREATE TABLE public.configurations\_rcs (  
    id integer NOT NULL,  
    client\_id integer,  
    logiciel\_programmation character varying(255),  
    logiciel\_diffusion character varying(255),  
    logiciel\_planification character varying(255),  
    streaming\_provider character varying(100),  
    zetta\_cloud boolean DEFAULT false,  
    disaster\_recovery boolean DEFAULT false,  
    zetta\_cloud\_option character varying(255),  
    zetta\_hosting boolean DEFAULT false,  
    revenus\_mensuels jsonb,  
    created\_at timestamp without time zone DEFAULT now(),  
    revenus\_programmation numeric(10,2),  
    revenus\_diffusion numeric(10,2),  
    revenus\_planification numeric(10,2),  
    revenus\_streaming numeric(10,2),  
    revenus\_zetta\_cloud numeric(10,2),  
    revenus\_autres numeric(10,2)  
);

CREATE TABLE public.contact\_roles (  
    id integer NOT NULL,  
    contact\_id integer,  
    role\_id integer NOT NULL  
);

CREATE TABLE public.contacts (  
    id integer NOT NULL,  
    client\_id integer,  
    nom character varying(255) NOT NULL,  
    fonction character varying(255),  
    telephone character varying(50),  
    email character varying(255),  
    est\_contact\_principal boolean DEFAULT true,  
    ordre\_affichage integer DEFAULT 0,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP  
);

CREATE TABLE public.products (  
    id integer NOT NULL,  
    reference character varying(50),  
    name character varying(255) NOT NULL,  
    name\_en character varying(255),  
    internal\_label character varying(255),  
    description text,  
    description\_en text,  
    product\_type character varying(50) NOT NULL,  
    unit\_price\_ht numeric(10,2),  
    daily\_rate\_ht numeric(10,2),  
    is\_active boolean DEFAULT true,  
    is\_addon boolean DEFAULT false,  
    addon\_rule character varying(50),  
    addon\_value numeric(10,2),  
    addon\_basis\_logiciel\_id integer,  
    addon\_basis\_service\_id integer,  
    created\_at timestamp with time zone DEFAULT now(),  
    updated\_at timestamp with time zone,  
    CONSTRAINT products\_addon\_rule\_check CHECK (((addon\_rule IS NULL) OR ((addon\_rule)::text \= ANY ((ARRAY\['PERCENTAGE'::character varying, 'FIXED\_AMOUNT'::character varying\])::text\[\])))),  
    CONSTRAINT products\_product\_type\_check CHECK (((product\_type)::text \= ANY ((ARRAY\['MATERIEL'::character varying, 'FORMATION'::character varying, 'PRESTATION\_SERVICE'::character varying, 'ADDON'::character varying\])::text\[\])))  
);

CREATE TABLE public.profils\_professionnels (  
    id integer NOT NULL,  
    client\_id integer,  
    type\_marche integer,  
    nb\_departs\_pub integer DEFAULT 0,  
    nb\_webradios integer DEFAULT 0,  
    created\_at timestamp without time zone DEFAULT now(),  
    types\_diffusion integer\[\] DEFAULT '{}'::integer\[\]  
);

CREATE TABLE public.quote\_items (  
    id integer NOT NULL,  
    section\_id integer NOT NULL,  
    product\_id integer,  
    product\_type character varying(50) NOT NULL,  
    description text,  
    description\_en text,  
    quantity numeric(10,2) NOT NULL,  
    unit\_of\_measure character varying(20),  
    unit\_price\_ht numeric(10,2) NOT NULL,  
    line\_discount\_percentage numeric(5,2) DEFAULT 0,  
    tva\_rate numeric(5,2) NOT NULL  
);

CREATE TABLE public.quote\_sections (  
    id integer NOT NULL,  
    quote\_id integer NOT NULL,  
    title character varying(255) NOT NULL,  
    title\_en character varying(255),  
    description text,  
    description\_en text,  
    display\_order integer  
);

CREATE TABLE public.quotes (  
    id integer NOT NULL,  
    quote\_number character varying(50) NOT NULL,  
    subject text,  
    client\_id integer NOT NULL,  
    user\_id integer,  
    status character varying(50) DEFAULT 'En cours'::character varying NOT NULL,  
    quote\_type character varying(50),  
    emission\_date date DEFAULT CURRENT\_DATE NOT NULL,  
    validity\_date date,  
    total\_ht\_after\_discount numeric(12,2) DEFAULT 0,  
    total\_tva numeric(12,2) DEFAULT 0,  
    total\_ttc numeric(12,2) DEFAULT 0,  
    total\_mensuel\_ht numeric(12,2) DEFAULT 0,  
    notes\_internes text,  
    conditions\_commerciales text,  
    created\_at timestamp with time zone DEFAULT now(),  
    updated\_at timestamp with time zone,  
    global\_discount\_percentage numeric(5,2) DEFAULT 0.00,  
    total\_ht\_before\_discount numeric(12,2) DEFAULT 0.00  
);

CREATE TABLE public.ref\_editeurs (  
    id integer NOT NULL,  
    nom character varying(255) NOT NULL,  
    actif boolean DEFAULT true,  
    created\_at timestamp with time zone DEFAULT CURRENT\_TIMESTAMP  
);

CREATE TABLE public.ref\_groupements (  
    id integer NOT NULL,  
    nom character varying(255) NOT NULL,  
    actif boolean DEFAULT true,  
    created\_at timestamp with time zone DEFAULT now(),  
    couleur character varying(7)  
);

CREATE TABLE public.ref\_logiciels (  
    id integer NOT NULL,  
    nom character varying(100) NOT NULL,  
    type\_logiciel character varying(50),  
    description text,  
    actif boolean DEFAULT true,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP,  
    updated\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP,  
    couleur character varying(7),  
    editeur\_id integer,  
    icon\_filename character varying(255),  
    name\_en character varying(100)  
);

CREATE TABLE public.ref\_pays (  
    id integer NOT NULL,  
    code\_iso character varying(3) NOT NULL,  
    nom character varying(100) NOT NULL,  
    actif boolean DEFAULT true,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP  
);

CREATE TABLE public.ref\_roles\_contact (  
    id integer NOT NULL,  
    nom character varying(100) NOT NULL,  
    actif boolean DEFAULT true,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP,  
    code character varying(50)  
);

CREATE TABLE public.ref\_services (  
    id integer NOT NULL,  
    nom character varying(255) NOT NULL,  
    categorie character varying(255),  
    permet\_plusieurs\_instances boolean DEFAULT false,  
    actif boolean DEFAULT true,  
    created\_at timestamp with time zone DEFAULT CURRENT\_TIMESTAMP,  
    editeur\_id integer,  
    name\_en character varying(255)  
);

CREATE TABLE public.ref\_statuts\_client (  
    id integer NOT NULL,  
    code character varying(50) NOT NULL,  
    nom character varying(100) NOT NULL,  
    ordre\_affichage integer DEFAULT 0,  
    actif boolean DEFAULT true,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP,  
    couleur character varying(7)  
);

CREATE TABLE public.ref\_tva (  
    id integer NOT NULL,  
    code\_pays\_iso character varying(2) NOT NULL,  
    taux\_tva numeric(5,2) NOT NULL,  
    description character varying(100),  
    is\_active boolean DEFAULT true,  
    created\_at timestamp with time zone DEFAULT now()  
);

CREATE TABLE public.ref\_types\_audience (  
    id integer NOT NULL,  
    nom character varying(255) NOT NULL,  
    description text,  
    actif boolean DEFAULT true NOT NULL,  
    created\_at timestamp with time zone DEFAULT now() NOT NULL,  
    updated\_at timestamp with time zone DEFAULT now() NOT NULL  
);

CREATE TABLE public.ref\_types\_diffusion (  
    id integer NOT NULL,  
    code character varying(50) NOT NULL,  
    nom character varying(100) NOT NULL,  
    actif boolean DEFAULT true,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP,  
    icon\_name character varying(255),  
    couleur character varying(7)  
);

CREATE TABLE public.ref\_types\_marche (  
    id integer NOT NULL,  
    nom character varying(100) NOT NULL,  
    actif boolean DEFAULT true,  
    created\_at timestamp without time zone DEFAULT CURRENT\_TIMESTAMP,  
    couleur character varying(7)  
);

CREATE TABLE public.ref\_vagues (  
    id integer NOT NULL,  
    nom character varying(255) NOT NULL,  
    annee integer,  
    type\_audience\_id integer NOT NULL,  
    actif boolean DEFAULT true NOT NULL,  
    created\_at timestamp with time zone DEFAULT now() NOT NULL,  
    updated\_at timestamp with time zone DEFAULT now() NOT NULL  
);

CREATE TABLE public.responsables (  
    id integer NOT NULL,  
    client\_id integer,  
    nom character varying(255) NOT NULL,  
    telephone character varying(50),  
    email character varying(255),  
    created\_at timestamp without time zone DEFAULT now()  
);

CREATE TABLE public.tarifs\_logiciels (  
    id integer NOT NULL,  
    logiciel\_id integer NOT NULL,  
    nom character varying(255) NOT NULL,  
    reference character varying(100) NOT NULL,  
    audience\_min integer,  
    audience\_max integer,  
    prix\_mensuel\_ht numeric(10,2) NOT NULL,  
    is\_active boolean DEFAULT true,  
    created\_at timestamp with time zone DEFAULT now(),  
    updated\_at timestamp with time zone,  
    description text,  
    description\_en text  
);

CREATE TABLE public.types\_diffusion\_ref (  
    id integer NOT NULL,  
    code character varying(20) NOT NULL,  
    libelle character varying(100) NOT NULL,  
    description text,  
    actif boolean DEFAULT true,  
    ordre\_affichage integer DEFAULT 0  
);

CREATE TABLE public.users (  
    id integer NOT NULL,  
    nom character varying(255) NOT NULL,  
    email character varying(255) NOT NULL,  
    password\_hash character varying(255) NOT NULL,  
    role public.user\_role DEFAULT 'viewer'::public.user\_role NOT NULL,  
    created\_at timestamp with time zone DEFAULT CURRENT\_TIMESTAMP,  
    updated\_at timestamp with time zone DEFAULT CURRENT\_TIMESTAMP  
);

\</details\>

## **6\. Scripts Utiles**

### **6.1. Backend**

Les commandes suivantes doivent être exécutées depuis le dossier backend.

* **Lancer le serveur en mode développement :**  
  npm run dev

* **Lancer le serveur en mode production :**  
  npm start

### **6.2. Frontend**

Les commandes suivantes doivent être exécutées depuis le dossier frontend.

* **Lancer le serveur en mode développement :**  
  npm run dev

* **Compiler l'application pour la production :**  
  npm run build

* **Lancer l'application en mode production :**  
  npm run start

## **7\. Structure du Projet**

### **7.1. Backend**

C:.  
│   .env  
│   import-final.js  
│   package-lock.json  
│   package.json  
│   query  
│   server.js  
│  
├───config  
│       database.js  
│  
├───controllers  
│       analyticsController.js  
│  
├───middleware  
│       auth.js  
│       roles.js  
│  
├───models  
│       audience.js  
│       client.js  
│       clientModel.js  
│       references.js  
│  
├───node\_modules  
│       (...)  
│  
├───public  
│   └───uploads  
│       └───logos  
├───routes  
│       actions.js  
│       analytics.js  
│       audiences.js  
│       auth.js  
│       client-services.js  
│       clients.js  
│       contacts.js  
│       dashboard.js  
│       editeurs.js  
│       groupements.js  
│       logiciels.js  
│       products.js  
│       quotes.js  
│       references.js  
│       search.js  
│       services.js  
│       statuts-client.js  
│       tarifs.js  
│       types-diffusion.js  
│       types-marche.js  
│       users.js  
│  
├───scripts  
│       createUser.js  
│  
├───uploads  
│   └───logos  
│           logo-174-1753195669986.png  
│           RCS.png  
│           ...  
│  
└───utils  
        generateQuotePDF.js

### **7.2. Frontend**

.  
├───public  
│   │   file.svg  
│   │   globe.svg  
│   │   next.svg  
│   │   vercel.svg  
│   │   window.svg  
│   │  
│   └───icons  
│           am-icone.png  
│           badge-netcom.png  
│           badge-selector.png  
│           badge-zetta.png  
│           dab-icone.png  
│           fm-icone.png  
│           indesradios.png  
│           ip-icone.png  
│           sat-icone.png  
│           tv-icone.png  
│  
└───src  
    │   app.zip  
    │  
    ├───app  
    │   │   favicon.ico  
    │   │   globals.css  
    │   │   layout.tsx  
    │   │   page.tsx  
    │   │  
    │   ├───account  
    │   │       page.tsx  
    │   │  
    │   ├───analytics  
    │   │       page.tsx  
    │   │  
    │   ├───audiences  
    │   │   └───import  
    │   │           page.tsx  
    │   │  
    │   ├───clients  
    │   │   │   page.tsx  
    │   │   │  
    │   │   ├───nouveau  
    │   │   │       page.tsx  
    │   │   │  
    │   │   └───\[id\]  
    │   │           page.tsx  
    │   │  
    │   │           └───edit  
    │   │                   page.tsx  
    │   │  
    │   ├───login  
    │   │       LoginPage.module.css  
    │   │       page.tsx  
    │   │  
    │   ├───parametres  
    │   │   │   page.tsx  
    │   │   │  
    │   │   ├───grilles-tarifaires  
    │   │   │       page.tsx  
    │   │   │  
    │   │   ├───logiciels  
    │   │   │       page.tsx  
    │   │   │  
    │   │   ├───produits  
    │   │   │       page.tsx  
    │   │   │  
    │   │   ├───references  
    │   │   │       page.tsx  
    │   │   │  
    │   │   ├───statuts-client  
    │   │   │       page.tsx  
    │   │   │  
    │   │   ├───types-diffusion  
    │   │   │       page.tsx  
    │   │   │  
    │   │   └───types-marche  
    │   │           page.tsx  
    │   │  
    │   ├───quotes  
    │   │   │   page.tsx  
    │   │   │  
    │   │   ├───nouveau  
    │   │   │       page.tsx  
    │   │   │  
    │   │   └───\[quoteId\]  
    │   │           page.tsx  
    │   │  
    │   └───users  
    │           page.tsx  
    │  
    ├───components  
    │   │   AudienceFormModal.tsx  
    │   │   AudienceSettings.tsx  
    │   │   BarChartCard.tsx  
    │   │   ClientAudienceCard.tsx  
    │   │   ClientDetailsCard.tsx  
    │   │   ConfigServicesCard.tsx  
    │   │   ConfirmationModal.tsx  
    │   │   ContactFormModal.tsx  
    │   │   ContactsCard.tsx  
    │   │   DerniereAudienceCard.tsx  
    │   │   ErrorBoundary.tsx  
    │   │   GoogleMapComponent.tsx  
    │   │   Header.tsx  
    │   │   ImportAddressModal.tsx  
    │   │   ImportContactModal.tsx  
    │   │   LayoutWrapper.tsx  
    │   │   LogoUploader.tsx  
    │   │   NotificationModal.tsx  
    │   │   PercentageCircle.tsx  
    │   │   PieChartCard.tsx  
    │   │   RcsKpiSection.tsx  
    │   │   ServiceFormModal.tsx  
    │   │   Sidebar.tsx  
    │   │   SizingCard.tsx  
    │   │  
    │   ├───analytics  
    │   │       AnalyticsCharts.tsx  
    │   │       AnalyticsFilters.tsx  
    │   │       AnalyticsKPIs.tsx  
    │   │       AnalyticsTable.tsx  
    │   │       SearchBar.tsx  
    │   │  
    │   ├───clients  
    │   │       ClientPageHeader.tsx  
    │   │       ClientQuotesList.tsx  
    │   │       ClientsTable.tsx  
    │   │       ClientStatCard.tsx  
    │   │       CommercialActionsHistory.tsx  
    │   │       FilterShortcutCard.tsx  
    │   │  
    │   ├───dashboard  
    │   │       CommercialSummaryCard.tsx  
    │   │       DashboardStatCard.tsx  
    │   │       OngoingQuotesCard.tsx  
    │   │       RecentActivityCard.tsx  
    │   │       RevenueCard.tsx  
    │   │       SoftwareDistributionCard.tsx  
    │   │       TopClientsCard.tsx  
    │   │       TopGroupsCard.tsx  
    │   │  
    │   └───users  
    │           UserFormModal.tsx  
    │           UsersList.tsx  
    │  
    ├───contexts  
    │       AuthContext.tsx  
    │       AuthProvider.tsx  
    │  
    ├───hooks  
    │       useApi.ts  
    │       useCRUDReferences.ts  
    │       useDebounce.ts  
    │       useReferences.ts  
    │  
    └───types  
            client.ts  
            index.ts

## **8\. Fonctionnalités Clés**

L'application "RCS Client System" offre un ensemble d'outils pour une gestion complète des clients et des activités commerciales.

### **8.1. Tableau de Bord (Dashboard)**

Le tableau de bord est la page d'accueil de l'application. Il offre une vue d'ensemble des indicateurs de performance clés (KPIs), des activités récentes et des tendances générales. Il est composé de plusieurs cartes interactives :

* **KPIs principaux** : Nombre total de radios, clients actifs, et prospects.  
* **Revenus** : Vue globale des revenus et répartition.  
* **Répartition des logiciels** : Graphique montrant la distribution des logiciels RCS utilisés par les clients.  
* **Activité récente** : Liste des derniers clients ajoutés ou mis à jour.  
* **Devis en cours** : Suivi des devis qui ne sont pas encore finalisés.  
* **Suivi commercial** : Résumé des dernières actions commerciales enregistrées.  
* **Top Clients & Groupes** : Classements des clients et des groupes générant le plus de revenus.

**Fichiers Associés :**

* **Frontend** :  
  * Page principale : src/app/page.tsx  
  * Composants dédiés :  
    * src/components/dashboard/DashboardStatCard.tsx  
    * src/components/dashboard/RevenueCard.tsx  
    * src/components/dashboard/SoftwareDistributionCard.tsx  
    * src/components/dashboard/RecentActivityCard.tsx  
    * src/components/dashboard/OngoingQuotesCard.tsx  
    * src/components/dashboard/CommercialSummaryCard.tsx  
    * src/components/dashboard/TopClientsCard.tsx  
    * src/components/dashboard/TopGroupsCard.tsx  
* **Backend** :  
  * Route API : routes/dashboard.js (qui expose l'endpoint /api/dashboard)  
  * Contrôleur : La logique de récupération des données est probablement gérée dans controllers/analyticsController.js ou un fichier similaire.

### **8.2. Gestion des Fiches Clients (Vue détaillée)**

Cette page offre une vue à 360 degrés d'un client unique. Elle agrège toutes les informations relatives à une radio dans une interface modulaire composée de plusieurs cartes.

* **En-tête** : Affiche le nom de la radio, son groupe, et permet la navigation entre les fiches clients (précédent/suivant), ainsi que les actions d'édition et de suppression.  
* **Gestion du Logo** : Permet de visualiser et de téléverser un nouveau logo pour le client.  
* **Détails du Client** : Carte principale affichant les informations administratives (raison sociale, adresse, pays).  
* **Dimensionnement** : Informations sur le profil professionnel de la radio (type de marché, nombre de webradios, etc.).  
* **Configuration & Services** : Récapitulatif des logiciels RCS utilisés, des services souscrits et du revenu total généré.  
* **Contacts** : Liste des contacts associés à la radio, avec la possibilité d'en ajouter, modifier ou supprimer.  
* **Audiences** : Affiche la dernière audience connue et un historique complet des audiences, avec des options pour ajouter, éditer et supprimer des mesures.  
* **Historique Commercial** : Journal de toutes les actions commerciales (appels, emails, réunions) menées avec le client.  
* **Devis** : Liste de tous les devis associés à ce client.

**Fichiers Associés :**

* **Frontend** :  
  * Page principale : src/app/clients/\[id\]/page.tsx  
  * Composants dédiés :  
    * src/components/clients/ClientPageHeader.tsx  
    * src/components/LogoUploader.tsx  
    * src/components/ClientDetailsCard.tsx  
    * src/components/SizingCard.tsx  
    * src/components/ConfigServicesCard.tsx  
    * src/components/ContactsCard.tsx  
    * src/components/DerniereAudienceCard.tsx  
    * src/components/ClientAudienceCard.tsx  
    * src/components/clients/CommercialActionsHistory.tsx  
    * src/components/clients/ClientQuotesList.tsx  
    * src/components/AudienceFormModal.tsx (pour la gestion des audiences)  
* **Backend** :  
  * Route API : routes/clients.js (en particulier l'endpoint GET /api/clients/:id)  
  * Routes associées pour les sous-ressources : routes/contacts.js, routes/audiences.js, routes/actions.js, routes/quotes.js.

### **8.3. Visualisation de la Liste des Clients**

Cette page est le cœur de la gestion du portefeuille client. Elle présente une liste complète de toutes les radios (clients, prospects, et non-clients) et offre des outils puissants pour la navigation et la gestion.

* **Affichage tabulaire** : Les clients sont affichés dans un tableau (ClientsTable) clair, montrant les informations essentielles comme le nom, le groupe, le contact principal, etc.  
* **Recherche dynamique** : Un champ de recherche permet de filtrer en temps réel la liste par nom de radio, de groupe ou de contact.  
* **Filtrage par statut** : Des cartes statistiques (ClientStatCard) en haut de page permettent de filtrer rapidement les clients par statut (Client, Prospect, Non Client).  
* **Raccourcis de filtres** : Des cartes dédiées (FilterShortcutCard) permettent d'appliquer des filtres pré-configurés comme "Indés Radio", "Marché National" ou "Associatif".  
* **Création et Suppression** : Un bouton "Nouveau Client" redirige vers le formulaire de création. Chaque ligne du tableau possède une option pour supprimer un client, avec une modale de confirmation pour éviter les erreurs.

**Fichiers Associés :**

* **Frontend** :  
  * Page principale : src/app/clients/page.tsx  
  * Composants dédiés :  
    * src/components/clients/ClientsTable.tsx  
    * src/components/clients/ClientStatCard.tsx  
    * src/components/clients/FilterShortcutCard.tsx  
* **Backend** :  
  * Route API : routes/clients.js (expose les endpoints /api/clients pour GET et /api/clients/:id pour DELETE)  
  * Modèles de données : models/client.js ou models/clientModel.js pour les interactions avec la table clients.

### **8.4. Analyse des Revenus**

*(À compléter)*

### **8.5. Suivi des Audiences**

*(À compléter)*

### **8.6. Paramètres de l'Application**

La section "Paramètres" est le centre de configuration de l'application. Elle n'a pas de fonctionnalité propre mais sert de portail vers les différents modules de configuration. La page d'accueil de cette section invite l'utilisateur à naviguer via le menu latéral pour accéder aux réglages spécifiques.

**Fichiers Associés :**

* **Frontend** :  
  * Page d'accueil des paramètres : src/app/parametres/page.tsx

#### **8.6.1. Gestion des Grilles Tarifaires**

Ce module, situé dans les paramètres, permet aux administrateurs de gérer les grilles de tarifs pour les logiciels RCS. Ces tarifs peuvent être fixes ou basés sur des paliers d'audience, et servent de base pour la création des devis d'abonnement.

* **Visualisation et Filtrage** : Les tarifs sont présentés dans un tableau détaillé. L'utilisateur peut filtrer la liste par logiciel pour se concentrer sur une gamme de produits spécifique.  
* **Tri** : Toutes les colonnes du tableau (Logiciel, Référence, Nom, etc.) peuvent être triées par ordre croissant ou décroissant pour faciliter la recherche.  
* **CRUD des Tarifs** :  
  * **Création** : Un bouton "Ajouter un tarif" ouvre une modale (TarifFormModal) permettant de définir un nouveau tarif en spécifiant le logiciel, la référence, le nom, les descriptions (FR/EN), le prix mensuel HT et, optionnellement, des paliers d'audience (min/max).  
  * **Modification** : Chaque ligne de tarif peut être modifiée via la même modale, pré-remplie avec les informations existantes.  
* **Duplication** : Une action "Copier" permet de créer rapidement un nouveau tarif en se basant sur un tarif existant, ce qui est utile pour créer des variations de prix.  
* **Archivage et Restauration** : Au lieu de supprimer un tarif (ce qui pourrait causer des problèmes de référence sur d'anciens devis), l'utilisateur peut l'archiver. Les tarifs archivés sont toujours visibles mais grisés et ne sont plus proposés lors de la création de nouveaux devis. Ils peuvent être restaurés à tout moment. Une modale de confirmation (ConfirmationModal) sécurise ces actions.

**Fichiers Associés :**

* **Frontend** :  
  * Page principale : src/app/parametres/grilles-tarifaires/page.tsx  
  * Composants dédiés (définis localement dans le fichier de la page) :  
    * TarifFormModal : Pour la création et l'édition.  
    * ConfirmationModal : Pour l'archivage/restauration.  
* **Backend** :  
  * Route API : routes/tarifs.js. Elle expose les endpoints pour :  
    * GET /api/tarifs : Récupérer tous les tarifs.  
    * POST /api/tarifs : Créer un nouveau tarif.  
    * PUT /api/tarifs/:id : Mettre à jour un tarif.  
    * DELETE /api/tarifs/:id : Archiver ou restaurer un tarif (soft delete).  
    * GET /api/tarifs/rcs-logiciels : Obtenir la liste des logiciels RCS pour les menus déroulants.

### **8.7. Création et Gestion de Devis**

Cette fonctionnalité est un module complet permettant de construire, éditer, sauvegarder et générer des devis en PDF. Le processus est guidé et s'adapte en fonction du type de devis.

* **Sélection du Type** : Au démarrage, l'utilisateur doit choisir entre un devis de type "Licences & Abonnements" ou "Matériel & Prestations", ce qui conditionne les produits disponibles et le calcul des totaux.  
* **Informations Générales** : L'utilisateur sélectionne un client via un champ de recherche, définit l'objet du devis, et ajuste les dates d'émission et de validité.  
* **Gestion par Sections** : Le devis est structuré en sections, que l'utilisateur peut ajouter, renommer et supprimer. Chaque section contient une ou plusieurs lignes de produits.  
* **Ajout de Lignes (Items)** : Dans chaque section, l'utilisateur peut ajouter des lignes de produits. Pour chaque ligne, il peut :  
  * **Rechercher dans le catalogue** : Un module de recherche permet de trouver un produit (logiciel, service, matériel...) existant. Le prix est automatiquement récupéré, et pour les abonnements, il est ajusté en fonction de l'audience du client si une grille tarifaire existe.  
  * **Saisir manuellement** : Pour les prestations non cataloguées, l'utilisateur peut saisir librement la description, la quantité, l'unité (jour, mois...) et le prix.  
  * **Appliquer une remise** : Une remise en pourcentage peut être appliquée sur chaque ligne.  
* **Récapitulatif en temps réel** : Un panneau latéral calcule et affiche dynamiquement les totaux :  
  * **Frais Uniques** : Total HT brut, remise globale, total HT net, TVA et total TTC.  
  * **Frais Récurrents** : Pour les devis de type "Licences & Abonnements", un total mensuel HT est calculé.  
* **Sauvegarde et Génération de PDF** : L'utilisateur peut sauvegarder le devis (création ou mise à jour). Une fois sauvegardé (en mode édition), il peut télécharger le devis en PDF, en français ou en anglais.

**Fichiers Associés :**

* **Frontend** :  
  * Pages principales : src/app/quotes/nouveau/page.tsx et src/app/quotes/\[quoteId\]/page.tsx. La logique est centralisée dans le composant QuoteFormPage.  
  * Composants dédiés (souvent définis dans le même fichier) :  
    * QuoteTypeSelectionModal  
    * ClientSearch  
    * QuoteSectionComponent  
    * QuoteItemComponent  
    * ProductSearch  
* **Backend** :  
  * Route API principale : routes/quotes.js. Elle gère :  
    * POST /api/quotes : Création d'un devis.  
    * PUT /api/quotes/:id : Mise à jour d'un devis.  
    * GET /api/quotes/:id : Récupération des données d'un devis.  
    * GET /api/quotes/:id/pdf : Génération du document PDF.  
    * POST /api/quotes/search-products : Recherche de produits dans le catalogue.  
    * POST /api/quotes/lookup-product : Recherche de prix spécifique pour un client.  
  * Utilitaires : utils/generateQuotePDF.js est utilisé pour la création du fichier PDF.

### **8.8. Gestion des Utilisateurs**

Cette page, accessible aux administrateurs, permet de gérer les comptes des utilisateurs de l'application.

* **Visualisation et Rôles** : Un tableau liste tous les utilisateurs avec leur nom, email et rôle (admin, editor, viewer). Les rôles sont mis en évidence par des badges de couleur pour une identification rapide des permissions.  
* **CRUD des Utilisateurs** :  
  * **Création** : Un bouton "Ajouter un utilisateur" ouvre une modale (UserFormModal) pour créer un nouvel utilisateur en définissant son nom, son email, son rôle et un mot de passe.  
  * **Modification** : Un bouton d'édition sur chaque ligne permet de modifier les informations d'un utilisateur existant via la même modale.  
  * **Suppression** : Un bouton de suppression permet de supprimer un compte. Une boîte de dialogue de confirmation (window.confirm) est affichée pour prévenir toute suppression accidentelle.  
* **Sécurité** : Un utilisateur ne peut pas supprimer son propre compte. Le bouton de suppression est désactivé sur la ligne de l'utilisateur actuellement connecté.

**Fichiers Associés :**

* **Frontend** :  
  * Page principale : src/app/users/page.tsx  
  * Composants dédiés : src/components/users/UserFormModal.tsx (inféré de l'arborescence), src/components/users/UsersList.tsx.  
* **Backend** :  
  * Route API : routes/users.js, qui gère les endpoints CRUD (GET /, POST /, PUT /:id, DELETE /:id).  
  * Middleware : Les routes sont protégées par les middlewares d'authentification (middleware/auth.js) et de contrôle de rôle (middleware/roles.js, pour s'assurer que seul un admin peut effectuer ces actions).

### **8.9. Gestion du Compte Personnel**

Cette fonctionnalité permet à l'utilisateur actuellement connecté de gérer ses propres informations de profil.

* **Visualisation et Modification** : La page affiche un formulaire pré-rempli avec le nom complet et l'adresse email de l'utilisateur. Ces champs peuvent être modifiés directement.  
* **Changement de Mot de Passe** : Un champ dédié permet à l'utilisateur de saisir un nouveau mot de passe. S'il est laissé vide, le mot de passe actuel n'est pas modifié.  
* **Mise à Jour Globale** : Après une mise à jour réussie du nom ou de l'email, l'état global de l'authentification (AuthContext) est mis à jour pour que les changements soient immédiatement visibles dans l'interface (par exemple, dans le header).

**Fichiers Associés :**

* **Frontend** :  
  * Page principale : src/app/account/page.tsx  
  * Contexte d'authentification : src/contexts/AuthProvider.tsx (contient la logique updateUser pour mettre à jour l'état global).  
* **Backend** :  
  * Route API : routes/users.js, qui doit contenir deux endpoints spécifiques protégés par le middleware d'authentification :  
    * GET /api/users/me : Pour récupérer les données de l'utilisateur connecté.  
    * PUT /api/users/me : Pour mettre à jour les données de l'utilisateur connecté.