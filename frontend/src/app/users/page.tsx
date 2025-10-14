// frontend/src/app/users/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthProvider'; // --- AJOUT 1 : Import du hook d'authentification ---
import { UserPlus, Edit, Trash2 } from 'lucide-react';

type User = {
  id: number;
  nom: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
};

export default function UsersPage() {
  const api = useApi();
  const { user: currentUser } = useAuth(); // --- AJOUT 2 : Récupération de l'utilisateur connecté ---
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la récupération des utilisateurs.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- AJOUT 3 : Logique de suppression d'un utilisateur ---
  const handleDelete = async (userId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      try {
        setError(null);
        await api.del(`/users/${userId}`);
        // Met à jour la liste des utilisateurs dans l'état local pour un retour visuel immédiat
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
      } catch (err: any) {
        // Affiche l'erreur renvoyée par l'API (ex: "Vous ne pouvez pas supprimer votre propre compte.")
        setError(err.message || 'Une erreur est survenue lors de la suppression.');
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
        <button className="btn-modern btn-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        {isLoading && <p className="text-center text-gray-500">Chargement des utilisateurs...</p>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
        
        {!isLoading && !error && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-4">Nom</th>
                <th className="p-4">Email</th>
                <th className="p-4">Rôle</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{user.nom}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button className="btn-icon btn-secondary"><Edit className="w-4 h-4" /></button>
                    {/* --- AJOUT 4 : Modification du bouton de suppression --- */}
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={currentUser?.id === user.id}
                      className="btn-icon btn-danger disabled:opacity-40 disabled:cursor-not-allowed"
                      title={currentUser?.id === user.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer cet utilisateur"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}