'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Met à jour l'état pour que le prochain rendu affiche l'interface de secours.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Vous pouvez également logger l'erreur vers un service de reporting.
    console.error("Erreur interceptée par ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Affiche une interface de secours personnalisée.
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800">Une erreur est survenue</h3>
          <p className="text-yellow-700">{this.props.fallbackMessage || 'Ce composant n\'a pas pu être chargé correctement.'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
