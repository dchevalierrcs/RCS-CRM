"use client";

import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthProvider';

export const useApi = () => {
  const { logout } = useAuth();
  
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const url = `${baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = { 
      ...options, 
      headers,
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      logout();
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const responseText = await response.text();
    const responseBody = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      throw new Error(responseBody?.message || 'Une erreur API est survenue.');
    }
    
    return responseBody?.data !== undefined ? responseBody.data : responseBody;

  }, [logout, baseURL]);

  const api = useMemo(() => ({
    get: (endpoint: string) => request(endpoint),
    post: (endpoint: string, body: any) => request(endpoint, { 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    put: (endpoint: string, body: any) => request(endpoint, { 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    del: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
  }), [request]);

  return api;
};

