// frontend/src/components/clients/ClientsTable.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Eye, Edit, Trash2, ArrowUpDown, ChevronDown, ChevronUp, 
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight 
} from 'lucide-react';

// Assurez-vous que cette interface correspond à celle de votre page principale
interface Client {
  id: number;
  nom_radio: string;
  nom_groupe?: string;
  contact_principal?: string;
  groupement?: string;
  chiffre_annuel?: number;
  type_marche?: string;
  types_diffusion?: string[];
  statut_client: 'Client' | 'Prospect' | 'Non Client';
  rcs_icons?: (string | null)[];
}

interface Props {
  clients: Client[];
  clientIdsForNavigation: string;
  onDeleteClick: (client: Client) => void;
}

type SortKey = keyof Client;

export default function ClientsTable({ clients, clientIdsForNavigation, onDeleteClick }: Props) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const sortedClients = useMemo(() => {
    if (!sortConfig) {
      return clients;
    }

    return [...clients].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [clients, sortConfig]);

  const totalPages = Math.ceil(sortedClients.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedClients, currentPage]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 ml-2 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="h-4 w-4 ml-2" />;
    }
    return <ChevronDown className="h-4 w-4 ml-2" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Client': return 'bg-green-100 text-green-800';
      case 'Prospect': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '';
    return `${value.toLocaleString('fr-FR')} €`;
  };

  const renderHeader = (label: string, key: SortKey) => (
    <th scope="col" className="px-6 py-3">
      <button onClick={() => requestSort(key)} className="flex items-center uppercase">
        {label}
        {getSortIcon(key)}
      </button>
    </th>
  );
  
  const PaginationControls = () => {
    const buttonClasses = "p-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";
    return (
      <div className="flex justify-end items-center py-4 px-2">
        <div className="flex items-center space-x-3">
          <span className="text-sm">
            Page <span className="font-semibold">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span>
          </span>
          <div className="flex space-x-2">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={buttonClasses} aria-label="Première page">
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className={buttonClasses} aria-label="Page précédente">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className={buttonClasses} aria-label="Page suivante">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={buttonClasses} aria-label="Dernière page">
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      {totalPages > 1 && <PaginationControls />}
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {renderHeader('Radio', 'nom_radio')}
            {renderHeader('Groupe', 'nom_groupe')}
            {renderHeader('Contact Principal', 'contact_principal')}
            {renderHeader('Type de Marché', 'type_marche')}
            <th scope="col" className="px-6 py-3 uppercase">Diffusion</th>
            {renderHeader('Groupement', 'groupement')}
            {renderHeader('Chiffre Annuel', 'chiffre_annuel')}
            {renderHeader('Status', 'statut_client')}
            <th scope="col" className="px-6 py-3 text-center uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedClients.map((client) => (
            <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">
                 <Link href={`/clients/${client.id}?list=${clientIdsForNavigation}`} className="hover:text-blue-600 transition-colors">
                    {client.nom_radio}
                  </Link>
              </td>
              <td className="px-6 py-4">{client.nom_groupe || ''}</td>
              <td className="px-6 py-4">{client.contact_principal || ''}</td>
              <td className="px-6 py-4">{client.type_marche || ''}</td>
              <td className="px-6 py-4">
                 <div className="flex flex-wrap gap-1">
                    {client.types_diffusion?.length ? client.types_diffusion.map(d => (
                      <span key={d} className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{d}</span>
                    )) : ''}
                  </div>
              </td>
              <td className="px-6 py-4">{client.groupement || ''}</td>
              <td className="px-6 py-4 font-mono text-right">{formatCurrency(client.chiffre_annuel)}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(client.statut_client)}`}>
                  {client.statut_client}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center space-x-2">
                  <Link href={`/clients/${client.id}?list=${clientIdsForNavigation}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></Link>
                  <Link href={`/clients/${client.id}/edit?list=${clientIdsForNavigation}`} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><Edit className="h-4 w-4" /></Link>
                  <button onClick={() => onDeleteClick(client)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && <PaginationControls />}
    </div>
  );
}