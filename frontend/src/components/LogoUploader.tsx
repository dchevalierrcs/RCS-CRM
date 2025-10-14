'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface Props {
  clientId: string;
  logoUrl: string | null;
  clientName: string;
  onUploadSuccess: () => void;
}

export default function LogoUploader({ clientId, logoUrl, clientName, onUploadSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const api = useApi();

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('logo', file);

    try {
      await api.post(`/clients/${clientId}/logo`, formData);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du logo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
      <div 
        onClick={handleLogoClick}
        // MODIFICATION : Ajout de 'rounded-md' ici
        className="h-24 w-24 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer border-2 border-dashed border-transparent group-hover:border-blue-500 transition-all"
      >
        {loading ? (
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        ) : logoUrl ? (
          // MODIFICATION : Ajout de 'rounded-md' ici pour l'image
          <img src={`http://localhost:5000${logoUrl}`} alt={`Logo de ${clientName}`} className="h-full w-full object-contain rounded-md" />
        ) : (
          <UploadCloud className="h-8 w-8 text-gray-400" />
        )}
        <div 
          // MODIFICATION : Ajout de 'rounded-md' ici pour l'overlay de survol
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all rounded-md"
        >
          <UploadCloud className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}