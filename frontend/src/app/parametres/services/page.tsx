// frontend/src/app/parametres/services/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import NotificationModal from '@/components/NotificationModal';
import { FaEdit, FaCopy, FaTrash } from 'react-icons/fa';

interface Service {
  id: number;
  nom: string;
  description: string;
  prix: string;
}

// Type pour les données du formulaire (sans l'ID, qui est généré par le backend)
type ServiceFormData = Omit<Service, 'id'>;

// MODALE LOCALE POUR LA GESTION DES SERVICES
interface LocalServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: ServiceFormData) => void;
  service: Service | Partial<Service> | null;
}

const LocalServiceFormModal = ({ isOpen, onClose, onSave, service }: LocalServiceFormModalProps) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    nom: '',
    description: '',
    prix: '',
  });

  useEffect(() => {
    if (service) {
      setFormData({
        nom: service.nom || '',
        description: service.description || '',
        prix: service.prix || '',
      });
    } else {
      // Réinitialiser pour la création d'un nouveau service
      setFormData({ nom: '', description: '', prix: '' });
    }
  }, [service, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{service && 'id' in service ? 'Modifier' : 'Ajouter'} une prestation</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              name="nom"
              id="nom"
              value={formData.nom}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="prix" className="block text-sm font-medium text-gray-700">Prix</label>
            <input
              type="text"
              name="prix"
              id="prix"
              value={formData.prix}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Définition locale du composant ConfirmationModal pour éviter les conflits d'importation.
interface ConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const LocalConfirmationModal: React.FC<ConfirmationModalProps> = ({ onClose, onConfirm, title, message }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [editingService, setEditingService] = useState<Service | Partial<Service> | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const { get, post, put, del } = useApi();

  const fetchServices = async () => {
    try {
      const response = await get('/services');
      setServices(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des services", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [get]);

  const handleOpenModal = (service: Service | null = null) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSaveService = async (serviceData: ServiceFormData) => {
    try {
      if (editingService && 'id' in editingService && editingService.id) {
        await put(`/services/${editingService.id}`, serviceData);
      } else {
        await post('/services', serviceData);
      }
      fetchServices();
      handleCloseModal();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du service", error);
    }
  };

  const handleDelete = (service: Service) => {
    setServiceToDelete(service);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await del(`/services/${serviceToDelete.id}`);
      fetchServices();
      setIsConfirmModalOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du service", error);
    }
  };

  const handleDuplicate = (serviceToDuplicate: Service) => {
    const { id, ...serviceCopy } = serviceToDuplicate;
    serviceCopy.nom = `${serviceCopy.nom} (Copie)`;
    setEditingService(serviceCopy);
    setIsModalOpen(true);
    setNotificationMessage('Service dupliqué. Vous êtes maintenant en mode édition.');
    setIsNotificationModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des Prestations</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-500 text-white px-4 py-2 rounded">
          Ajouter une prestation
        </button>
      </div>

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-6 py-4 whitespace-nowrap">{service.nom}</td>
                <td className="px-6 py-4">{service.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">{service.prix} €</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-4">
                  <button onClick={() => handleOpenModal(service)} className="text-indigo-600 hover:text-indigo-900">
                    <FaEdit size={20} />
                  </button>
                  <button onClick={() => handleDuplicate(service)} className="text-blue-600 hover:text-blue-900">
                    <FaCopy size={20} />
                  </button>
                  <button onClick={() => handleDelete(service)} className="text-red-600 hover:text-red-900">
                    <FaTrash size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LocalServiceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveService}
        service={editingService}
      />

      {isConfirmModalOpen && (
        <LocalConfirmationModal
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={confirmDelete}
          title="Confirmer la suppression"
          message={`Êtes-vous sûr de vouloir supprimer le service "${serviceToDelete?.nom}" ?`}
        />
      )}

      {isNotificationModalOpen && (
        <NotificationModal
          type="info"
          title="Information"
          message={notificationMessage}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ServicesPage;

