import { useState, FormEvent } from 'react';
import { X, Mail, Lock, User, AlertCircle, Sparkles, LogIn } from 'lucide-react';
import { TranslationSet } from '../types';

interface AuthModalProps {
  t: TranslationSet;
  onClose: () => void;
  onLoginSuccess: (email: string, name: string) => void;
}

export default function AuthModal({
  t,
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 4) {
      setErrorMsg('A palavra-passe deve conter pelo menos 4 caracteres.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Por favor, indique o seu nome completo.');
      return;
    }

    // Determine name for login
    let loginName = name || email.split('@')[0];
    if (email.toLowerCase() === 'smaccaseiro@gmail.com') {
      loginName = 'Afonso Caseiro (Admin)';
    }

    onLoginSuccess(email.toLowerCase(), loginName);
    onClose();
  };

  const handleOAuthLogin = (provider: 'google' | 'apple') => {
    // Simulate standard prompt oauth callback latency
    const simulatedEmail = provider === 'google' ? 'user.google@gmail.com' : 'user.apple@icloud.com';
    const simulatedName = provider === 'google' ? 'Google Reader' : 'Apple Reader';
    
    onLoginSuccess(simulatedEmail, simulatedName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Auth Container card */}
      <div className="relative bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-brand-gray/30 dark:border-brand-medium/20 z-10 animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="font-serif text-2xl font-bold tracking-tight text-brand-dark dark:text-white">
              {mode === 'login' ? t.login : t.register}
            </h3>
            <p className="text-xs text-gray-400">Entre na biblioteca digital premium da Caseiro Editora.</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/25 text-xs flex items-center space-x-1.5 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Core Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria Santos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Endereço de Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="Ex: maria@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Dica: Faça login com <strong>smaccaseiro@gmail.com</strong> para aceder ao Painel Administrativo!</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Palavra-passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 rounded-lg bg-brand-gold text-brand-dark hover:bg-brand-gold-light font-bold text-sm shadow-md transition-colors flex items-center justify-center space-x-1.5"
            >
              <LogIn className="w-4 h-4 text-brand-dark" />
              <span>{mode === 'login' ? 'Iniciar Sessão' : 'Criar Conta Premium'}</span>
            </button>
          </form>

          {/* Direct 1-Click Admin Login Option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onLoginSuccess('smaccaseiro@gmail.com', 'Afonso Caseiro (Admin)');
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-brand-darker/60 hover:bg-brand-dark border border-brand-gold/50 hover:border-brand-gold text-brand-gold text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm group"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold group-hover:rotate-12 transition-transform" />
              <span>Entrar Imediatamente como Administrador (1 Clique)</span>
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-1">Conta Admin: smaccaseiro@gmail.com</p>
          </div>

          {/* Social login buttons */}
          <div className="space-y-3.5 border-t border-brand-gray/20 dark:border-brand-medium/10 pt-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Ou aceda através de</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center space-x-1.5 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-xs font-semibold bg-transparent hover:bg-brand-medium/5"
              >
                <span>Google Connection</span>
              </button>
              <button
                onClick={() => handleOAuthLogin('apple')}
                className="flex items-center justify-center space-x-1.5 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-xs font-semibold bg-transparent hover:bg-brand-medium/5"
              >
                <span>Apple Security</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs">
            {mode === 'login' ? (
              <p className="text-gray-400">
                Ainda não tem conta?{' '}
                <button 
                  onClick={() => setMode('register')} 
                  className="text-brand-medium dark:text-brand-gold font-bold hover:underline"
                >
                  Registe-se agora
                </button>
              </p>
            ) : (
              <p className="text-gray-400">
                Já possui uma conta ativa?{' '}
                <button 
                  onClick={() => setMode('login')} 
                  className="text-brand-medium dark:text-brand-gold font-bold hover:underline"
                >
                  Iniciar Sessão
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
