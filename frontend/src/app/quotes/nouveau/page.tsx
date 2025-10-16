// frontend/src/app/quotes/nouveau/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import NotificationModal from '@/components/NotificationModal';

// Définition des types pour une meilleure robustesse
interface Client {
  id: number;
  nom: string;
  adresse: string;
  ville: string;
  [key: string]: any; 
}

interface Product {
  id: number;
  nom: string;
  description: string;
  prix: string;
  type: string;
}

interface Service {
  id: number;
  nom: string;
  description: string;
  prix: string;
}

type QuoteItem = (Product | Service) & {
  uniqueId: number;
  itemType: 'produit' | 'service';
};

interface NotificationState {
  message: string;
  title: string;
  type: 'warning' | 'info';
}

const NewQuotePage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteTitle, setQuoteTitle] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const { get, post } = useApi();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes, servicesRes] = await Promise.all([
          get('/clients'),
          get('/products'),
          get('/services')
        ]);
        setClients(clientsRes.data);
        setProducts(productsRes.data);
        setServices(servicesRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [get]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    setSelectedClient(client || null);
  };

  const addToQuote = (item: Product | Service, type: 'produit' | 'service') => {
    const isSubscription = (item as Product).type === 'abonnement';
    if (isSubscription && !selectedClient) {
      setNotification({
        title: "Client requis",
        message: "Veuillez sélectionner un client avant d'ajouter un produit à abonnement.",
        type: "warning"
      });
      return;
    }
    
    const newItem: QuoteItem = { ...item, itemType: type, uniqueId: Date.now() };
    setQuoteItems([...quoteItems, newItem]);
  };

  const removeFromQuote = (uniqueId: number) => {
    setQuoteItems(quoteItems.filter(item => item.uniqueId !== uniqueId));
  };

  const calculateTotal = () => {
    return quoteItems.reduce((total, item) => total + parseFloat(item.prix || '0'), 0);
  };

  const createQuote = async () => {
    if (!selectedClient || quoteItems.length === 0) {
      setNotification({
        title: 'Action requise',
        message: 'Veuillez sélectionner un client et ajouter au moins un produit ou service au devis.',
        type: 'warning'
      });
      return;
    }
  
    const quoteData = {
      client_id: selectedClient.id,
      titre: quoteTitle,
      total: calculateTotal(),
      items: quoteItems.map(({ id, itemType }) => ({ id, type: itemType })),
    };
  
    try {
      const response = await post('/quotes', quoteData);
      router.push(`/quotes/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create quote:', error);
      setNotification({
        title: 'Erreur',
        message: 'Erreur lors de la création du devis.',
        type: 'warning'
      });
    }
  };
  
  const filteredProducts = products.filter(p => p.nom.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredServices = services.filter(s => s.nom.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container mx-auto p-4 grid grid-cols-12 gap-6">
      {notification && (
        <NotificationModal
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Colonne de gauche: Panier et détails du client */}
      <div className="col-span-4">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Client</h2>
          <select onChange={(e) => handleClientSelect(e.target.value)} className="w-full p-2 border rounded">
            <option>Sélectionner un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.nom}</option>
            ))}
          </select>
          {selectedClient && (
            <div className="mt-4">
              <p><strong>Adresse:</strong> {selectedClient.adresse}</p>
              <p><strong>Ville:</strong> {selectedClient.ville}</p>
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Devis</h2>
          <input
            type="text"
            value={quoteTitle}
            onChange={(e) => setQuoteTitle(e.target.value)}
            placeholder="Titre du devis"
            className="w-full p-2 border rounded mb-4"
          />
          <ul>
            {quoteItems.map(item => (
              <li key={item.uniqueId} className="flex justify-between items-center mb-2">
                <span>{item.nom}</span>
                <span>{item.prix} €</span>
                <button onClick={() => removeFromQuote(item.uniqueId)} className="text-red-500">X</button>
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{calculateTotal().toFixed(2)} €</span>
          </div>
          <button onClick={createQuote} className="w-full bg-green-500 text-white p-2 mt-4 rounded">Créer le devis</button>
        </div>
      </div>

      {/* Colonne de droite: Produits et Services */}
      <div className="col-span-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('products')} className={`py-2 px-4 ${activeTab === 'products' ? 'border-b-2 border-blue-500' : ''}`}>Produits</button>
            <button onClick={() => setActiveTab('services')} className={`py-2 px-4 ${activeTab === 'services' ? 'border-b-2 border-blue-500' : ''}`}>Prestations</button>
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 border rounded mt-4"
          />
          <div className="mt-4">
            {activeTab === 'products' && (
              <ul>
                {filteredProducts.map(product => (
                  <li key={product.id} className="flex justify-between items-center mb-2 p-2 hover:bg-gray-100 rounded">
                    <div>
                      <p className="font-bold">{product.nom}</p>
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{product.prix} €</p>
                      <button onClick={() => addToQuote(product, 'produit')} className="text-blue-500">Ajouter</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {activeTab === 'services' && (
              <ul>
                {filteredServices.map(service => (
                  <li key={service.id} className="flex justify-between items-center mb-2 p-2 hover:bg-gray-100 rounded">
                    <div>
                      <p className="font-bold">{service.nom}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{service.prix} €</p>
                      <button onClick={() => addToQuote(service, 'service')} className="text-blue-500">Ajouter</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewQuotePage;

