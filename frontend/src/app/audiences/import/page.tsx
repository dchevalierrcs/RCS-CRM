'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportAudiencesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('http://localhost:5000/api/audiences/import', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur lors de l\'import'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Import des Audiences</h2>
        <p className="text-gray-600 mt-2">Importez les données d'audience depuis un fichier CSV</p>
      </div>

      <div className="dashboard-card">
        <div className="card-body space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier CSV des audiences
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{file.name}</span>
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="btn-modern btn-primary"
              >
                {importing ? 'Import en cours...' : 'Importer'}
              </button>
            </div>
          )}

          {result && (
            <div className={`flex items-center space-x-3 p-4 rounded-lg ${
              result.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.message}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
