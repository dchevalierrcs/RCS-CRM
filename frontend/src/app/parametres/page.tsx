// frontend/src/app/parametres/page.tsx
'use client';

import React from 'react';
import { Settings, Grid } from 'lucide-react';

export default function ParametresRedirectPage() {
    return (
        <div className="p-8 flex flex-col items-center justify-center text-center h-full">
            <Settings className="w-16 h-16 text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Paramètres de l'Application</h1>
            <p className="text-gray-600 mt-2">
                Veuillez sélectionner une catégorie dans le menu de gauche pour commencer.
            </p>
            <a href="/parametres/grilles-tarifaires" className="mt-6 flex items-center bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
                <Grid className="h-5 w-5 mr-2" />
                Commencer avec les Grilles Tarifaires
            </a>
        </div>
    );
}

