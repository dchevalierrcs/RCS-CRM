// frontend/src/app/account/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthProvider'; // <-- On importe useAuth
import { Save } from 'lucide-react';

type FormData = {
  nom: string;
  email: string;
  password?: string;
};

export default function AccountPage() {
  const api = useApi();
  const { updateUser } = useAuth(); // <-- On récupère notre nouvelle fonction
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await api.get('/users/me');
        reset(userData);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchUserData();
  }, [api, reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    const payload: { nom: string; email: string; password?: string } = { 
      nom: data.nom,
      email: data.email 
    };
    if (data.password) {
      payload.password = data.password;
    }

    try {
      const result = await api.put('/users/me', payload);
      setSuccess(result.message || 'Profil mis à jour avec succès !');
      updateUser(result.data); // <-- On met à jour l'état global de l'utilisateur !
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mon Compte</h1>

      <div className="bg-white p-8 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="nom" className="block text-sm font-bold text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              id="nom"
              type="text"
              {...register('nom', { required: 'Le nom est obligatoire' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email', { 
                required: 'L\'email est obligatoire',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Format d\'email invalide'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>

          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg">{success}</div>}
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-modern btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}