"use client";

import React, { useState, FormEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthProvider';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // On récupère la fonction login centralisée depuis le contexte
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // --- CORRECTION : On appelle directement la fonction login du contexte ---
      // La logique d'appel API est maintenant dans AuthProvider, pas ici.
      await login({ email, password });
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <Image
            src="http://localhost:5000/uploads/logos/RCS.png"
            alt="Logo RCS Europe"
            width={120}
            height={120}
            priority
            unoptimized
          />
        </div>
        
        <h1 className={styles.title}>RCS Clients</h1>
        <p className={styles.subtitle}>Connectez-vous pour accéder au CRM</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Adresse Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn-modern btn-primary w-full justify-center mt-4">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

