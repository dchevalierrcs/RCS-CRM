// components/ConfigServicesCard.tsx
'use client';

import { Settings } from 'lucide-react';

interface Service {
  id: number;
  nom: string;
  valeur_mensuelle: string | number;
}

interface ConfigDetails {
  logiciel_programmation?: string;
  revenus_programmation_mensuel?: string | number;
  logiciel_diffusion?: string;
  revenus_diffusion_mensuel?: string | number;
  logiciel_planification?: string;
  revenus_planification_mensuel?: string | number;
  streaming_provider?: string;
  revenus_streaming_mensuel?: string | number;
  services?: Service[];
}

interface TotalRevenue {
  mensuel: number;
  annuel: number;
}

interface Props {
  client: ConfigDetails;
  totalRevenue: TotalRevenue;
}

const formatCurrency = (amount: number) => `${amount.toLocaleString('fr-FR')} €`;

export default function ConfigServicesCard({ client, totalRevenue }: Props) {
  return (
    <div className="dashboard-card p-4">
      <h3 className="card-title font-bold text-lg flex items-center mb-4">
        <Settings className="h-5 w-5 mr-2" />
        Configuration et Services
        <span className="ml-auto text-green-600 font-bold">
          {formatCurrency(totalRevenue.mensuel)}
          <span className="text-xs font-normal text-gray-500">
            {' '}(Annuel : {formatCurrency(totalRevenue.annuel)})
          </span>
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div className="border-b md:border-b-0 md:border-r md:pr-8 pb-4 md:pb-0">
          <p className="text-xs text-gray-500 mb-2">Logiciels</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Programmation: <strong className="text-gray-800">{client.logiciel_programmation || '-'}</strong></span>
              <span>{formatCurrency(Number(client.revenus_programmation_mensuel))}</span>
            </div>
            <div className="flex justify-between">
              <span>Diffusion: <strong className="text-gray-800">{client.logiciel_diffusion || '-'}</strong></span>
              <span>{formatCurrency(Number(client.revenus_diffusion_mensuel))}</span>
            </div>
            <div className="flex justify-between">
              <span>Planification: <strong className="text-gray-800">{client.logiciel_planification || '-'}</strong></span>
              <span>{formatCurrency(Number(client.revenus_planification_mensuel))}</span>
            </div>
            <div className="flex justify-between">
              <span>Streaming: <strong className="text-gray-800">{client.streaming_provider || '-'}</strong></span>
              <span>{formatCurrency(Number(client.revenus_streaming_mensuel))}</span>
            </div>
          </div>
        </div>
        <div className="pt-4 md:pt-0">
          <p className="text-xs text-gray-500 mb-2">Services Souscrits</p>
          {/* Correction appliquée ici */}
          {(client.services && client.services.length > 0) ? (
            <div className="space-y-2 text-sm">
              {client.services.map((s) => (
                <div key={s.id} className="flex justify-between">
                  <span className="font-semibold">{s.nom}</span>
                  <span>{formatCurrency(Number(s.valeur_mensuelle))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucun service souscrit.</p>
          )}
        </div>
      </div>
    </div>
  );
}