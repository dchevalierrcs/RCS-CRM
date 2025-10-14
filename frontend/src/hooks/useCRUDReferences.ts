// src/hooks/useCRUDReferences.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from './useApi';

interface CRUDItem {
  id: number;
  [key: string]: any;
}

interface MutationResult {
  success: boolean;
  error?: string;
}

interface CRUDOperations {
  items: CRUDItem[];
  loading: boolean;
  error: string | null;
  create: (data: Omit<CRUDItem, 'id'>) => Promise<MutationResult>;
  update: (id: number, data: Partial<CRUDItem>) => Promise<MutationResult>;
  delete: (id: number) => Promise<MutationResult>;
  refresh: () => Promise<void>;
  toggleActive: (id: number, currentStatus: boolean) => Promise<MutationResult>;
}

export const useCRUDReferences = (
  endpointName: string,
  initialData: CRUDItem[] = []
): CRUDOperations => {
  const [items, setItems] = useState<CRUDItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  // --- CORRECTION : Logique de routage intelligente ---
  // Détermine la route API correcte à appeler en fonction du nom de la ressource.
  const endpoint = useMemo(() => {
    const isGenericReference = ['groupements'].includes(endpointName);
    const formattedEndpoint = endpointName.replace(/_/g, '-');
    
    // Les routes spécifiques (ex: /products) sont appelées directement, 
    // les autres passent par la route générique /references/:tableName
    const directRoutes = ['products', 'logiciels', 'services', 'editeurs', 'types-marche', 'statuts-client', 'types-diffusion'];

    if (directRoutes.includes(formattedEndpoint)) {
        return `/${formattedEndpoint}`;
    }
    return `/references/${formattedEndpoint}`;

  }, [endpointName]);

  const handleError = (err: any, operation: string): MutationResult => {
    console.error(`Erreur ${operation}:`, err);
    const message = err.message || `Erreur lors de ${operation}`;
    setError(message);
    return { success: false, error: message };
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(endpoint);
      // La plupart des routes renvoient { success: true, data: [...] }, la route /references renvoie directement les données.
      const data = result.data || result;
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [api, endpoint]);

  // --- CORRECTION DE LA BOUCLE INFINIE ---
  // Le rafraîchissement ne se déclenche que si le `endpoint` change, ce qui est stable.
  useEffect(() => {
    refresh();
  }, [endpoint]);

  const create = async (data: Omit<CRUDItem, 'id'>): Promise<MutationResult> => {
    try {
      await api.post(endpoint, data);
      return { success: true };
    } catch (err) {
      return handleError(err, 'la création');
    }
  };

  const update = async (id: number, data: Partial<CRUDItem>): Promise<MutationResult> => {
    try {
      await api.put(`${endpoint}/${id}`, data);
      return { success: true };
    } catch (err) {
      return handleError(err, 'la modification');
    }
  };

  const deleteItem = async (id: number): Promise<MutationResult> => {
    try {
      await api.del(`${endpoint}/${id}`);
      return { success: true };
    } catch (err) {
      return handleError(err, 'la suppression');
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean): Promise<MutationResult> => {
    return await update(id, { actif: !currentStatus });
  };

  return { items, loading, error, create, update, delete: deleteItem, refresh, toggleActive };
};

