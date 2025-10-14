// frontend/src/components/clients/CommercialActionsHistory.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthProvider';
import { PlusCircle, Edit, Trash2, Calendar, Clock, MessageSquare, Phone, Users } from 'lucide-react';

// Type pour une action commerciale
type CommercialAction = {
  id: number;
  action_type: string;
  subject: string;
  details: string;
  action_date: string;
  follow_up_date?: string;
  status: string;
  user_name: string;
};

// Type pour les données du formulaire
type FormInputs = Omit<CommercialAction, 'id' | 'user_name'> & { client_id: number };

// Props du composant
type CommercialActionsHistoryProps = {
  clientId: number;
};

// Fonction pour formater les dates
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const ActionIcon = ({ type }: { type: string }) => {
    switch (type.toLowerCase()) {
        case 'appel': return <Phone className="w-5 h-5 text-blue-500" />;
        case 'email': return <MessageSquare className="w-5 h-5 text-green-500" />;
        case 'rendez-vous': return <Users className="w-5 h-5 text-purple-500" />;
        default: return <Calendar className="w-5 h-5 text-gray-500" />;
    }
};

export default function CommercialActionsHistory({ clientId }: CommercialActionsHistoryProps) {
  const api = useApi();
  const { user } = useAuth();
  const [actions, setActions] = useState<CommercialAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<CommercialAction | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInputs>();

  const fetchActions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/actions?clientId=${clientId}`);
      setActions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api, clientId]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const openModal = (action: CommercialAction | null = null) => {
    setEditingAction(action);
    if (action) {
      reset({
        ...action,
        client_id: clientId,
        action_date: action.action_date.split('T')[0], // Format YYYY-MM-DD for input
        follow_up_date: action.follow_up_date?.split('T')[0],
      });
    } else {
      reset({
        client_id: clientId,
        action_type: 'Appel',
        status: 'Terminé',
        action_date: new Date().toISOString().split('T')[0],
        subject: '',
        details: '',
        follow_up_date: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
    reset();
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      if (editingAction) {
        await api.put(`/actions/${editingAction.id}`, data);
      } else {
        await api.post('/actions', data);
      }
      fetchActions();
      closeModal();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette action ?")) {
      try {
        await api.del(`/actions/${id}`);
        fetchActions();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Historique Commercial</h2>
        <button onClick={() => openModal()} className="btn-modern btn-primary">
          <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter une action
        </button>
      </div>

      {isLoading && <p>Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div className="space-y-4">
        {actions.length > 0 ? actions.map(action => (
          <div key={action.id} className="p-4 border rounded-lg flex items-start space-x-4">
            <div className="flex-shrink-0 pt-1">
                <ActionIcon type={action.action_type} />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-700">{action.subject || 'Action'}</p>
                  <p className="text-sm text-gray-500">
                    Par {action.user_name} le {formatDate(action.action_date)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${action.status === 'Terminé' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {action.status}
                  </span>
                  <button onClick={() => openModal(action)} className="text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(action.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="mt-2 text-gray-600">{action.details}</p>
              {action.follow_up_date && (
                <p className="mt-2 text-sm text-orange-600 font-semibold flex items-center">
                  <Calendar size={14} className="mr-2" />
                  Suivi prévu le: {formatDate(action.follow_up_date)}
                </p>
              )}
            </div>
          </div>
        )) : (
          !isLoading && <p className="text-gray-500 text-center py-4">Aucune action commerciale enregistrée pour ce client.</p>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-2xl">
            <h3 className="text-2xl font-bold mb-6">{editingAction ? 'Modifier' : 'Ajouter'} une action</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Type d'action</label>
                  <select {...register('action_type', { required: true })} className="input-form">
                    <option>Appel</option>
                    <option>Email</option>
                    <option>Rendez-vous</option>
                    <option>Démonstration</option>
                    <option>Autre</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date de l'action</label>
                  <input type="date" {...register('action_date', { required: true })} className="input-form" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sujet</label>
                <input {...register('subject', { required: 'Le sujet est requis' })} className="input-form" placeholder="Ex: Prise de contact GSelector" />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Détails / Compte-rendu</label>
                <textarea {...register('details')} rows={4} className="input-form" placeholder="Détails de l'échange..."></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date de suivi (optionnel)</label>
                  <input type="date" {...register('follow_up_date')} className="input-form" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Statut</label>
                  <select {...register('status')} className="input-form">
                    <option>Terminé</option>
                    <option>À faire</option>
                    <option>Annulé</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={closeModal} className="btn-modern btn-secondary">Annuler</button>
                <button type="submit" className="btn-modern btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

