'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Audience, TypeAudience, Vague } from '@/types';
import axios from 'axios';

interface AudienceFormData {
  type_audience_id: number;
  vague_id: number | ''; // CORRIGÉ : On autorise une chaîne vide pour le placeholder
  audience: number;
}

interface Props {
  audience: Partial<Audience> | null;
  onSave: (data: Partial<Audience>) => void;
  onCancel: () => void;
  saving: boolean;
  audienceTypes: TypeAudience[];
  availableVagues: Vague[];
}

export default function AudienceFormModal({ audience, onSave, onCancel, saving, audienceTypes, availableVagues }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AudienceFormData>();

  const isEditing = !!audience?.id;
  const selectedTypeId = watch('type_audience_id');
  const [vaguesForType, setVaguesForType] = useState<Vague[]>([]);

  useEffect(() => {
    if (audience) {
      reset({
        type_audience_id: audience.type_audience_id,
        vague_id: audience.vague_id,
        audience: audience.audience,
      });
    } else {
      reset({ // On s'assure que les valeurs par défaut sont bien définies
        type_audience_id: undefined,
        vague_id: '',
        audience: undefined
      });
    }
  }, [audience, reset]);
  
  useEffect(() => {
    if (selectedTypeId) {
        if(isEditing && audience?.type_audience_id === selectedTypeId) {
            setVaguesForType(availableVagues);
        } else {
            axios.get(`http://localhost:5000/api/references/vagues?typeAudienceId=${selectedTypeId}`)
                .then(res => {
                    setVaguesForType(res.data.data);
                    if (!isEditing) {
                        // CORRIGÉ : On réinitialise avec une chaîne vide, pas undefined
                        setValue('vague_id', '');
                    }
                });
        }
    } else {
      setVaguesForType([]);
    }
  }, [selectedTypeId, isEditing, audience, availableVagues, setValue]);


  const onSubmit: SubmitHandler<AudienceFormData> = (data) => {
    onSave({ 
      id: audience?.id, 
      ...data,
      type_audience_id: Number(data.type_audience_id),
      vague_id: Number(data.vague_id),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold">{isEditing ? 'Modifier' : 'Ajouter'} une audience</h3>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Type d'audience *</label>
              <select
                {...register('type_audience_id', { required: "Le type est requis" })}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={isEditing}
              >
                <option value="">Sélectionner un type...</option>
                {audienceTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.nom}</option>
                ))}
              </select>
              {errors.type_audience_id && <p className="text-red-600 text-sm mt-1">{errors.type_audience_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Vague *</label>
              <select
                {...register('vague_id', { required: 'La vague est requise' })}
                className="w-full px-3 py-2 border rounded-lg"
                disabled={!selectedTypeId}
              >
                <option value="">Sélectionner une vague...</option>
                {vaguesForType.map(vague => (
                  <option key={vague.id} value={vague.id}>{vague.nom} ({vague.annee})</option>
                ))}
              </select>
              {errors.vague_id && <p className="text-red-600 text-sm mt-1">{errors.vague_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Audience *</label>
              <input
                type="number"
                {...register('audience', { required: "L'audience est requise", valueAsNumber: true, min: 0 })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ex: 125000"
              />
              {errors.audience && <p className="text-red-600 text-sm mt-1">{errors.audience.message}</p>}
            </div>
          </div>
          <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
            <button type="button" onClick={onCancel} className="btn-modern btn-secondary mr-2">Annuler</button>
            <button type="submit" disabled={saving} className="btn-modern btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}