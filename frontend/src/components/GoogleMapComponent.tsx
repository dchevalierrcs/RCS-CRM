'use client';

import { useState, useEffect, memo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

interface MapProps {
  address: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

function GoogleMapComponent({ address }: MapProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  // NOUVEAU : État pour gérer les erreurs de géocodage de manière contrôlée
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    // On réinitialise les états à chaque changement d'adresse
    setCoordinates(null);
    setGeocodingError(null);

    if (isLoaded && address) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setCoordinates({ lat: location.lat(), lng: location.lng() });
        } else {
          // MODIFICATION : Au lieu d'une erreur console, on met à jour l'état
          let errorMessage = `Impossible de localiser l'adresse (Erreur: ${status}).`;
          if (status === 'REQUEST_DENIED') {
            errorMessage = "La clé d'API Google Maps est manquante, invalide ou non activée.";
          } else if (status === 'ZERO_RESULTS') {
            errorMessage = "Aucun résultat trouvé pour cette adresse.";
          }
          setGeocodingError(errorMessage);
        }
      });
    }
  }, [address, isLoaded]);

  // --- Logique d'affichage mise à jour ---

  // Erreur de chargement du script Google Maps
  if (loadError) return <div className="flex items-center justify-center h-full bg-gray-100 text-sm text-red-600 p-4 text-center">Erreur de chargement du script de la carte</div>;
  
  // Erreur de géocodage (ex: clé API manquante)
  if (geocodingError) return <div className="flex items-center justify-center h-full bg-red-50 text-sm text-red-700 p-4 text-center">{geocodingError}</div>;

  // Script en cours de chargement
  if (!isLoaded) return <div className="flex items-center justify-center h-full bg-gray-100 text-sm text-gray-500">Chargement de la carte...</div>;
  
  // Adresse non fournie au composant
  if (!address) return <div className="flex items-center justify-center h-full bg-gray-100 text-sm text-gray-500">Adresse non spécifiée</div>;
  
  // En attente des coordonnées ou géocodage sans succès (mais sans erreur bloquante)
  if (!coordinates) return <div className="flex items-center justify-center h-full bg-gray-100 text-sm text-gray-500 p-4 text-center">Recherche des coordonnées...</div>;

  // Affichage de la carte si tout est OK
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={coordinates}
      zoom={14}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      <MarkerF position={coordinates} />
    </GoogleMap>
  );
}

export default memo(GoogleMapComponent);