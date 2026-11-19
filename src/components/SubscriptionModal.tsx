import { useState } from 'react';
import { X, Check, CreditCard, Loader2, Sparkles, Shield, RefreshCw, ExternalLink, Lock } from 'lucide-react';
import { TranslationSet } from '../types';

interface SubscriptionModalProps {
  t: TranslationSet;
  onClose: () => void;
  onSubscribeSuccess?: (plan: 'monthly' | 'annual') => void;
  customerEmail?: string;
}

export default function SubscriptionModal({
  t,
  onClose,
  customerEmail,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [step, setStep] = useState<'plans' | 'payment'>('plans');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<{ message: string; isConfigError?: boolean } | null>(null);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);

  const plans = {
    monthly: {
      id: 'monthly' as const,
      name: t.monthly,
      price: '3,99',
      period: 'mês',
      features: [
        'Acesso total à biblioteca em 6 idiomas',
        'Leitura offline (downloads em PDF e EPUB)',
        'Sincronização de progresso na nuvem',
        'Notificações de novos lançamentos',
      ],
    },
    annual: {
      id: 'annual' as const,
      name: t.annual,
      price: '29,99',
      period: 'ano',
      badge: t.bestValue,
      features: [
        'Tudo incluído no plano Mensal',
        'Poupe mais de 37% em comparação com o mensal',
        'Suporte prioritário ao leitor',
        'Acesso antecipado a pré-lançamentos exclusivos',
      ],
    },
  };

  const handleSelectPlan = (plan: 'monthly' | 'annual') => {
    setSelectedPlan(plan);
    setStripeError(null);
    setStripeCheckoutUrl(null);
    setStep('payment');
  };

  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    setStripeError(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          email: customerEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'STRIPE_NOT_CONFIGURED' || data.code === 'STRIPE_INVALID_KEY') {
          setStripeError({
            message: data.message || 'Configuração da chave Stripe inválida ou não encontrada.',
            isConfigError: true,
          });
        } else {
          setStripeError({
            message: data.message || data.error || 'Erro ao processar o pagamento online.',
          });
        }
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        setStripeLoading(false);
        setStripeCheckoutUrl(data.url);
        // Attempt direct navigation when not framed; inside iframe users use the secure anchor button
        try {
          if (window.top === window.self) {
            window.location.href = data.url;
          }
        } catch {
          // Cross-origin iframe prevents top navigation; anchor CTA in UI opens Stripe Checkout securely
        }
      } else {
        throw new Error('URL de checkout inválida retornada pelo servidor.');
      }
    } catch (err) {
      console.error('Erro de rede ao ligar ao servidor:', err);
      setStripeError({
        message: 'Não foi possível estabelecer ligação ao servidor de pagamentos. Tente novamente.',
      });
      setStripeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-brand-gray/30 dark:border-brand-medium/20 z-10 animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors z-20 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-brand-dark text-white p-6 sm:p-8 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-medium/55 to-brand-dark opacity-65" />
          <div className="relative space-y-2">
            <div className="inline-flex items-center space-x-1.5 text-brand-gold text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acesso Membro Ilimitado</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Caseiro Editora Premium</h3>
            <p className="text-xs text-gray-300 max-w-md mx-auto">
              Desbloqueie todo o catálogo em 6 idiomas, sincronize o progresso e leia offline.
            </p>
          </div>
        </div>

        {step === 'plans' ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between text-left ${
                  selectedPlan === 'monthly'
                    ? 'border-brand-medium dark:border-brand-gold bg-brand-gold/5'
                    : 'border-brand-gray/40 dark:border-brand-medium/15 hover:border-brand-medium/50'
                }`}
              >
                <div>
                  <h4 className="font-serif font-bold text-lg">{plans.monthly.name}</h4>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-brand-dark dark:text-white">€{plans.monthly.price}</span>
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/{plans.monthly.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plans.monthly.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs">
                        <Check className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan('monthly');
                  }}
                  className="mt-8 w-full py-2.5 rounded-lg text-xs font-bold bg-brand-medium text-white hover:bg-brand-dark transition-colors text-center cursor-pointer"
                >
                  Selecionar Plano Mensal
                </button>
              </div>

              {/* Annual Plan */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between text-left ${
                  selectedPlan === 'annual'
                    ? 'border-brand-gold bg-brand-gold/10 dark:bg-brand-gold/5 shadow-lg'
                    : 'border-brand-gray/40 dark:border-brand-medium/15 hover:border-brand-medium/50'
                }`}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-gold-dark dark:text-brand-gold mb-1">
                  ★ {plans.annual.badge}
                </div>

                <div>
                  <h4 className="font-serif font-bold text-lg text-brand-gold-dark dark:text-brand-gold">{plans.annual.name}</h4>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold text-brand-dark dark:text-white">€{plans.annual.price}</span>
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/{plans.annual.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plans.annual.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs">
                        <Check className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan('annual');
                  }}
                  className="mt-8 w-full py-2.5 rounded-lg text-xs font-bold bg-brand-gold text-brand-dark hover:bg-brand-gold-light transition-colors text-center shadow-md cursor-pointer"
                >
                  Selecionar Plano Anual
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400 border-t border-brand-gray/30 dark:border-brand-medium/15 pt-4">
              <Shield className="w-4 h-4 text-brand-gold" />
              <span>Validação server-side garantida · Pagamentos encriptados via Stripe</span>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6 relative text-left">
            <div className="flex items-center justify-between border-b border-brand-gray/20 dark:border-brand-medium/10 pb-4">
              <button
                type="button"
                onClick={() => {
                  setStep('plans');
                  setStripeError(null);
                  setStripeCheckoutUrl(null);
                }}
                className="text-xs text-brand-medium dark:text-brand-gold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Alterar plano selecionado</span>
              </button>
              <span className="text-sm font-bold text-brand-medium dark:text-brand-gold">
                Total: €{plans[selectedPlan].price} / {plans[selectedPlan].period}
              </span>
            </div>

            {stripeError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 p-4 rounded-xl text-xs space-y-2 animate-fade-in text-brand-charcoal dark:text-gray-200">
                <p className="font-semibold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{stripeError.isConfigError ? 'Configuração do Stripe Pendente' : 'Erro no Pagamento'}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{stripeError.message}</p>
              </div>
            )}

            {stripeCheckoutUrl ? (
              <div className="py-4 space-y-5 text-center animate-fade-in">
                <div className="w-14 h-14 bg-brand-gold/15 text-brand-gold rounded-full flex items-center justify-center mx-auto border border-brand-gold/30">
                  <ExternalLink className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-serif font-bold text-lg sm:text-xl text-brand-dark dark:text-brand-gold">
                    Sessão Oficial Stripe Pronta
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
                    Por segurança bancária, conclua a assinatura no portal encriptado da Stripe. Após pagar, a sua conta é validada automaticamente.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href={stripeCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-brand-gold text-brand-dark font-extrabold text-sm shadow-lg hover:bg-brand-gold-light transition-all cursor-pointer"
                  >
                    <span>Pagar Agora no Stripe</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <div>
                    <button
                      type="button"
                      onClick={() => setStripeCheckoutUrl(null)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                    >
                      Gerar nova sessão
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Checkout Encriptado Oficial
                </p>

                <button
                  type="button"
                  disabled={stripeLoading}
                  onClick={handleStripeCheckout}
                  className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/15 transition-all text-left shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5">
                    {stripeLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-brand-gold" />
                    )}
                    <div>
                      <span className="text-sm font-bold block text-brand-dark dark:text-white">
                        Pagar com Cartão, Apple Pay ou Google Pay
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Portal oficial Stripe · Ativação verificada após pagamento
                      </span>
                    </div>
                  </div>
                  <Lock className="w-4 h-4 text-brand-gold shrink-0" />
                </button>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed text-center pt-2">
                  Sem fidelização. Pode cancelar a renovação automática a qualquer momento na Área do Utilizador.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
