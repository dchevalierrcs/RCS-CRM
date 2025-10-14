// frontend/src/components/users/UsersList.tsx
"use client";

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthProvider';

interface UsersListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDeleteSuccess: () => void;
}

const UsersList: React.FC<UsersListProps> = ({ users, onEdit, onDeleteSuccess }) => {
  const { token, user: currentUser } = useAuth();

  const handleDelete = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erreur lors de la suppression.');
      alert('Utilisateur supprimé avec succès.');
      onDeleteSuccess();
    } catch (error: any) {
      alert(`Erreur : ${error.message}`);
    }
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
          <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nom}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
              <button onClick={() => onEdit(user)} className="text-indigo-600 hover:text-indigo-900" title="Modifier">
                <Edit size={18} />
              </button>
              {currentUser?.id !== user.id && ( // Empêche l'admin de voir le bouton pour se supprimer lui-même
                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                  <Trash2 size={18} />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UsersList;