// components/SizingCard.tsx
'use client';

// Remplacement de 'Megaphone' par 'Banknote'
import { Wifi, Store, Banknote, Globe, Signal } from 'lucide-react';
import React from 'react';

interface SizingDetails {
  type_marche?: string;
  nb_departs_pub?: number;
  nb_webradios?: number;
  // Interface mise à jour pour inclure icon_name
  types_diffusion?: { id: number; nom: string; icon_name?: string | null }[];
}

interface Props {
  client: SizingDetails;
}

// Petit composant interne pour afficher une paire Label/Valeur (mis à jour avec icône)
const InfoItem = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ElementType }) => (
  <div className="flex items-start">
    {Icon && <Icon className="h-5 w-5 mr-3 text-primary-blue flex-shrink-0 mt-0.5" />}
    <div>
      <p className="block text-sm font-bold text-gray-700 mb-1">{label}</p>
      <p className="text-gray-900 font-semibold">{value || '-'}</p>
    </div>
  </div>
);

export default function SizingCard({ client }: Props) {
  return (
    <div className="dashboard-card p-4">
      <div className="card-header">
        <h3 className="card-title font-bold text-lg flex items-center mb-4">
          <Wifi className="h-5 w-5 mr-2" />
          Dimensionnement
        </h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne de gauche (avec icônes) */}
          <div className="space-y-4">
            <InfoItem icon={Store} label="Type marché" value={client.type_marche} />
            {/* Icône mise à jour pour 'Départs pub' */}
            <InfoItem icon={Banknote} label="Départs pub" value={client.nb_departs_pub} />
            <InfoItem icon={Globe} label="Webradios" value={client.nb_webradios} />
          </div>

          {/* Colonne de droite (mise à jour) */}
          <div>
            <p className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
              <Signal className="h-4 w-4 mr-2" />
              Types de diffusion
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Logique mise à jour pour afficher l'icône et le nom */}
              {(client.types_diffusion && client.types_diffusion.length > 0) ? (
                client.types_diffusion.map((t) => (
                  <span 
                    key={t.id} 
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {t.icon_name && (
                      <img 
                        src={`/icons/${t.icon_name}`} 
                        alt={`Icône ${t.nom}`}
                        className="h-4 w-4"
                        // Sécurité : cache l'icône si le fichier est manquant
                        onError={(e) => (e.currentTarget.style.display = 'none')} 
                      />
                    )}
                    {t.nom}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">-</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}