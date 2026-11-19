import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Erro inesperado na aplicação.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught UI error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-darker text-white p-6">
          <div className="max-w-md w-full bg-brand-charcoal border border-brand-gold/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">Algo correu mal</h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Ocorreu um problema inesperado ao processar os dados da biblioteca. Tente recarregar a página.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-gold text-brand-dark font-bold text-xs hover:bg-brand-gold-light transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar Aplicação</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
