import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-brand-gold/40 bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold text-xs font-bold transition-colors cursor-pointer"
        title="Instalar aplicação Caseiro Editora"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-brand-gold/40 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold text-xs font-semibold transition-colors cursor-pointer"
          title="Instalar no iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-brand-charcoal border border-brand-gold/30 p-6 shadow-2xl text-left text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-brand-gold">Instalar no iPhone / iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-xs text-gray-200 space-y-2 leading-relaxed list-decimal list-inside">
                <li>Toque no ícone <strong>Partilhar</strong> na barra inferior do Safari.</li>
                <li>Deslize para baixo e selecione <strong>Ecrã Principal</strong> (Add to Home Screen).</li>
                <li>Toque em <strong>Adicionar</strong> para abrir a biblioteca como app nativa.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-brand-gold text-brand-dark text-xs font-bold hover:bg-brand-gold-light transition-colors"
              >
                Compreendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
