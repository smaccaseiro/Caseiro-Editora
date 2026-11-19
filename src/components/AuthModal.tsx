import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { X, AlertCircle, Loader2, ShieldCheck, BookOpen } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { TranslationSet } from '../types';

interface AuthModalProps {
  t: TranslationSet;
  onClose: () => void;
  onLoginSuccess?: (email: string, name: string, uid: string) => void;
}

export default function AuthModal({
  t,
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = (fbUser.email || '').toLowerCase();
      const name = fbUser.displayName || email.split('@')[0] || 'Leitor';

      if (onLoginSuccess) {
        onLoginSuccess(email, name, fbUser.uid);
      }
      onClose();
    } catch (err: any) {
      console.error('Erro na autenticação Google:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('A janela de autenticação foi fechada antes da conclusão.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('O navegador bloqueou a janela pop-up. Permita pop-ups para iniciar sessão.');
      } else {
        setErrorMsg('Não foi possível iniciar sessão com o Google. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-brand-gray/30 dark:border-brand-medium/20 z-10 animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-brand-medium/15 dark:bg-brand-medium/40 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold tracking-tight text-brand-dark dark:text-white">
              {t.login}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 leading-relaxed">
              Aceda à sua conta Caseiro Editora com autenticação segura Google para sincronizar favoritos, progresso de leitura e subscrições entre todos os dispositivos.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 text-xs flex items-center space-x-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-3 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-brand-dark" />
                <span>A autenticar com segurança...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </>
            )}
          </button>

          <div className="pt-4 border-t border-brand-gray/25 dark:border-brand-medium/20 flex items-start space-x-2.5 text-left">
            <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Sessão protegida por Firebase Authentication. O acesso de administração é validado automaticamente apenas para a conta verificada do editor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
