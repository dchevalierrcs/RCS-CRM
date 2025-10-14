// frontend/src/hooks/useReferences.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi'; // <-- On importe notre assistant
// On importe TOUS les types nécessaires depuis le fichier central
import { 
  Logiciel, 
  References 
} from '@/types';

// Hook principal pour charger toutes les références
export const useReferences = () => {
  const [references, setReferences] = useState<Partial<References>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi(); // <-- On initialise l'assistant

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        setLoading(true);

        // On utilise des chemins relatifs, l'assistant gère l'URL de base
        const endpoints = {
          statuts_client: '/references/statuts_client',
          pays: '/references/pays',
          logiciels: '/references/logiciels',
          types_marche: '/references/types_marche',
          types_diffusion: '/references/types_diffusion',
          roles_contact: '/references/roles_contact',
          groupements: '/references/groupements',
          editeurs: '/references/editeurs',
          services: '/references/services',
          types_audience: '/references/types_audience',
          vagues: '/references/vagues',
        };

        // On utilise l'assistant api.get pour chaque appel
        const responses = await Promise.all(
          Object.entries(endpoints).map(([key, endpoint]) => 
            api.get(endpoint).then(data => ({ key, data }))
          )
        );

        const assembledReferences = responses.reduce((acc, { key, data }) => {
          acc[key as keyof References] = data;
          return acc;
        }, {} as Partial<References>);
        
        setReferences(assembledReferences);
        setError(null);

      } catch (err: any) {
        console.error('Erreur fetch références:', err);
        setError(err.message || 'Erreur de connexion pour charger les listes de références');
      } finally {
        setLoading(false);
      }
    };

    fetchReferences();
  }, [api]); // <-- On ajoute 'api' aux dépendances

  return { references, loading, error };
};

// Hook spécialisé pour les logiciels par type
export const useLogiciels = (type?: string) => {
  const [logiciels, setLogiciels] = useState<Logiciel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi(); // <-- On initialise l'assistant

  useEffect(() => {
    const fetchLogiciels = async () => {
      try {
        setLoading(true);
        const endpoint = type 
          ? `/logiciels?type=${type}`
          : '/logiciels';
        
        // On utilise l'assistant api.get
        const data = await api.get(endpoint);
        
        setLogiciels(data);
        setError(null);
      } catch (err: any) {
        console.error('Erreur fetch logiciels:', err);
        setError(err.message || 'Erreur de connexion aux logiciels');
      } finally {
        setLoading(false);
      }
    };

    fetchLogiciels();
  }, [api, type]); // <-- On ajoute 'api' et 'type' aux dépendances

  return { logiciels, loading, error };
};