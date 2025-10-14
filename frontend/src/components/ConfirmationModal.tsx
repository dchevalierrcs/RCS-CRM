'use client';

import { Trash2, Loader2 } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
  isConfirming,
  confirmText = 'Supprimer définitivement',
  cancelText = 'Annuler',
}: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl transform transition-all">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Cette action est irréversible.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p>
        <div className="flex space-x-3 justify-end">
          <button type="button" onClick={onCancel} className="btn-modern btn-secondary" disabled={isConfirming}>
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className="btn-modern bg-red-600 text-white hover:bg-red-700 w-48" disabled={isConfirming}>
            {isConfirming ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
