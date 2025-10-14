// frontend/src/components/users/UserFormModal.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthProvider';

interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'viewer' as 'viewer' | 'editor' | 'admin'
  });
  const [error, setError] = useState<string | null>(null);
  const isEditing = user !== null;

  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        nom: user.nom,
        email: user.email,
        password: '', // On ne pré-remplit jamais le mot de passe
        role: user.role
      });
    }
  }, [isEditing, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // En mode création, le mot de passe est obligatoire
    if (!isEditing && !formData.password) {
      setError('Le mot de passe est obligatoire pour un nouvel utilisateur.');
      return;
    }

    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/users`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Une erreur est survenue.');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Modifier' : 'Créer'} un utilisateur</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
              <input type="text" id="nom" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input type="password" id="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder={isEditing ? 'Laisser vide pour ne pas changer' : ''} />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rôle</label>
              <select id="role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="btn-modern btn-secondary">Annuler</button>
            <button type="submit" className="btn-modern btn-primary">{isEditing ? 'Mettre à jour' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;