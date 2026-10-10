import { useState, FormEvent } from 'react';
import { X, Check, CreditCard, Apple, Chrome, Loader2, Sparkles, Shield, RefreshCw, ExternalLink } from 'lucide-react';
import { TranslationSet } from '../types';

interface SubscriptionModalProps {
  t: TranslationSet;
  onClose: () => void;
  onSubscribeSuccess: (plan: 'monthly' | 'annual') => void;
  customerEmail?: string;
}

export default function SubscriptionModal({
  t,
  onClose,
  onSubscribeSuccess,
  customerEmail,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'applepay' | 'googlepay' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'plans' | 'payment'>('plans');

  // Stripe checkout states
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<{ message: string; isConfigError?: boolean } | null>(null);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);

  // Credit Card Form State (Simulation Fallback)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const plans = {
    monthly: {
      id: 'monthly' as const,
      name: t.monthly,
      price: '6,99',
      period: 'mês',
      features: [
        'Acesso total à biblioteca em 6 idiomas',
        'Leitura offline (downloads ilimitados)',
        'Sincronização de progresso ("Continuar leitura")',
        'Notificações de novos lançamentos'
      ]
    },
    annual: {
      id: 'annual' as const,
      name: t.annual,
      price: '59,99',
      period: 'ano',
      badge: t.bestValue,
      features: [
        'Tudo incluído no plano Mensal',
        'Poupe mais de 30% em comparação com o mensal',
        'Suporte prioritário ao cliente',
        'Acesso antecipado a pré-lançamentos exclusivos'
      ]
    }
  };

  const handleSelectPlan = (plan: 'monthly' | 'annual') => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handlePaymentSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate standard credit card processing lag (1.5 seconds)
    setTimeout(() => {
      setIsProcessing(false);
      onSubscribeSuccess(selectedPlan);
      onClose();
    }, 1500);
  };

  const triggerInstantPayment = (method: 'paypal' | 'applepay' | 'googlepay') => {
    setPaymentMethod(method);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onSubscribeSuccess(selectedPlan);
      onClose();
    }, 1800);
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
            isConfigError: true
          });
        } else {
          setStripeError({
            message: data.message || data.error || 'Erro ao processar o pagamento online.'
          });
        }
        setStripeLoading(false);
        return;
      }

      if (data.url) {
        setStripeLoading(false);
        setStripeCheckoutUrl(data.url);

        // Try opening in a new window/tab to bypass iframe X-Frame-Options blocking
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // If popup blocked, attempt top window navigation
          try {
            if (window.top && window.top !== window.self) {
              window.top.location.href = data.url;
            } else {
              window.location.href = data.url;
            }
          } catch {
            // Browser blocked top navigation; user can click the action button rendered in modal UI
          }
        }
      } else {
        throw new Error('URL de checkout inválida retornada pelo servidor.');
      }
    } catch (err: any) {
      console.error('Erro de rede ao ligar ao servidor:', err);
      setStripeError({
        message: 'Não foi possível estabelecer ligação ao servidor de pagamentos. Por favor, tente novamente.'
      });
      setStripeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-brand-gray/30 dark:border-brand-medium/20 z-10 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-brand-dark text-white p-6 sm:p-8 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-medium/55 to-brand-dark opacity-65" />
          <div className="relative space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acesso Membro Ilimitado</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Caseiro Editora Premium</h3>
            <p className="text-xs text-gray-300 max-w-md mx-auto">Desbloqueie todo o nosso catálogo imediatamente em 6 idiomas e leia sem limites.</p>
          </div>
        </div>

        {/* Dynamic Step View */}
        {step === 'plans' ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Plan */}
              <div 
                onClick={() => setSelectedPlan('monthly')}
                className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
                  selectedPlan === 'monthly'
                    ? 'border-brand-medium dark:border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/2'
                    : 'border-brand-gray/40 dark:border-brand-medium/10 bg-transparent hover:border-brand-medium/50'
                }`}
              >
                <div>
                  <h4 className="font-serif font-bold text-lg">{plans.monthly.name}</h4>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-brand-dark dark:text-white">€{plans.monthly.price}</span>
                    <span className="ml-1 text-sm text-gray-400">/{plans.monthly.period}</span>
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
                  onClick={() => handleSelectPlan('monthly')}
                  className="mt-8 w-full py-2.5 rounded-lg text-xs font-bold bg-brand-medium text-white hover:bg-brand-dark transition-colors text-center"
                >
                  Selecionar Plano
                </button>
              </div>

              {/* Annual Plan */}
              <div 
                onClick={() => setSelectedPlan('annual')}
                className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between ${
                  selectedPlan === 'annual'
                    ? 'border-brand-gold bg-brand-gold/10 dark:bg-brand-gold/5 shadow-lg'
                    : 'border-brand-gray/40 dark:border-brand-medium/10 bg-transparent hover:border-brand-medium/50'
                }`}
              >
                {/* Popular Badge */}
                <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-brand-gold text-brand-dark text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                  {plans.annual.badge}
                </div>

                <div>
                  <h4 className="font-serif font-bold text-lg text-brand-gold-dark dark:text-brand-gold">{plans.annual.name}</h4>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-brand-dark dark:text-white">€{plans.annual.price}</span>
                    <span className="ml-1 text-sm text-gray-400">/{plans.annual.period}</span>
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
                  onClick={() => handleSelectPlan('annual')}
                  className="mt-8 w-full py-2.5 rounded-lg text-xs font-bold bg-brand-gold text-brand-dark hover:bg-brand-gold-light transition-colors text-center shadow-md"
                >
                  Selecionar Plano
                </button>
              </div>
            </div>

            {/* Secure Badge Footer */}
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 border-t border-brand-gray/30 dark:border-brand-medium/15 pt-4">
              <Shield className="w-4 h-4 text-brand-gold" />
              <span>Garantia de Reembolso de 14 dias • Pagamentos Seguros Encriptados</span>
            </div>
          </div>
        ) : (
          /* Payment Step Layout */
          <div className="p-6 sm:p-8 space-y-6 relative">
            <div className="flex items-center justify-between border-b border-brand-gray/20 dark:border-brand-medium/10 pb-4">
              <button 
                onClick={() => {
                  setStep('plans');
                  setStripeError(null);
                }}
                className="text-xs text-brand-medium dark:text-brand-gold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Alterar plano selecionado</span>
              </button>
              <span className="text-sm font-bold text-brand-medium dark:text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-lg">
                Total: €{plans[selectedPlan].price} / {plans[selectedPlan].period}
              </span>
            </div>

            {/* Error or Configuration Alert Display */}
            {stripeError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 p-4 rounded-xl text-xs space-y-2 animate-fade-in text-brand-charcoal dark:text-gray-200">
                <p className="font-semibold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{stripeError.isConfigError ? 'Configuração do Stripe Pendente' : 'Erro no Pagamento'}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {stripeError.message}
                </p>
                {stripeError.isConfigError && (
                  <div className="pt-1.5 space-y-2 border-t border-red-200/50 dark:border-red-900/20">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Para ativar pagamentos online reais, o administrador do site deve configurar a variável <strong>STRIPE_SECRET_KEY</strong> no painel de Segredos (Secrets) do Google AI Studio.
                    </p>
                    <button
                      onClick={() => {
                        setPaymentMethod('stripe');
                        setStripeError(null);
                      }}
                      className="bg-amber-600 dark:bg-brand-gold text-white dark:text-brand-dark px-3 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-90 transition-opacity cursor-pointer shadow"
                    >
                      Utilizar Modo de Simulação (Testar sem pagar)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stripe External Checkout Ready Screen */}
            {stripeCheckoutUrl ? (
              <div className="py-4 space-y-5 text-center animate-fade-in">
                <div className="w-14 h-14 bg-brand-gold/15 text-brand-gold rounded-full flex items-center justify-center mx-auto border border-brand-gold/30">
                  <ExternalLink className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-serif font-bold text-lg sm:text-xl text-brand-dark dark:text-brand-gold">
                    Página Oficial Stripe Pronta
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
                    Por motivos de segurança e encriptação bancária, o checkout oficial do Stripe abre numa página separada.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href={stripeCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-brand-gold text-brand-dark font-extrabold text-sm shadow-lg hover:bg-brand-gold-light active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Abrir Checkout Seguro no Stripe</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setStripeCheckoutUrl(null);
                        setPaymentMethod(null);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                    >
                      Voltar e escolher outro método
                    </button>
                  </div>
                </div>
              </div>
            ) : paymentMethod === null ? (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Método de Pagamento Principal</p>

                {/* Real Stripe Checkout Button */}
                <button
                  disabled={stripeLoading}
                  onClick={handleStripeCheckout}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/15 transition-all text-left shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    {stripeLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
                    ) : (
                      <CreditCard className="w-5 h-5 text-brand-gold animate-pulse" />
                    )}
                    <div>
                      <span className="text-sm font-bold block text-brand-dark dark:text-white">Pagar de Forma Segura com Stripe</span>
                      <span className="text-xs text-gray-400">Redirecionamento para o gateway de pagamento oficial da Stripe</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-wider bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded">Real</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-brand-gray/25 dark:border-brand-medium/15"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase font-bold tracking-wider">ou simular pagamento sandbox</span>
                  <div className="flex-grow border-t border-brand-gray/25 dark:border-brand-medium/15"></div>
                </div>

                {/* Simulated Credit Card fallback selection button */}
                <button
                  onClick={() => {
                    setPaymentMethod('stripe');
                    setStripeError(null);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-brand-gray/55 dark:border-brand-medium/20 bg-transparent hover:border-brand-medium dark:hover:border-brand-gold hover:bg-brand-gold/2 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-semibold block">Simulador de Cartão de Crédito</span>
                      <span className="text-[11px] text-gray-500">Testar a subscrição premium sem qualquer custo real</span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold border border-gray-400 px-1 rounded text-gray-400">Simulador</span>
                </button>

                {/* PayPal Simulation */}
                <button
                  onClick={() => triggerInstantPayment('paypal')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-brand-gray/55 dark:border-brand-medium/20 bg-transparent hover:border-brand-medium dark:hover:border-brand-gold hover:bg-brand-gold/2 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-brand-gold font-bold italic font-serif text-sm">PayPal</span>
                    <span className="text-sm font-semibold">{t.paymentPaypal}</span>
                  </div>
                  <span className="text-xs text-gray-400">Ativação instantânea</span>
                </button>

                {/* Apple Pay Simulation */}
                <button
                  onClick={() => triggerInstantPayment('applepay')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-brand-gray/55 dark:border-brand-medium/20 bg-transparent hover:border-brand-medium dark:hover:border-brand-gold hover:bg-brand-gold/2 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Apple className="w-5 h-5" />
                    <span className="text-sm font-semibold">{t.paymentApplePay}</span>
                  </div>
                  <span className="text-xs text-gray-400">One-Tap</span>
                </button>

                {/* Google Pay Simulation */}
                <button
                  onClick={() => triggerInstantPayment('googlepay')}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-brand-gray/55 dark:border-brand-medium/20 bg-transparent hover:border-brand-medium dark:hover:border-brand-gold hover:bg-brand-gold/2 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Chrome className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-semibold">{t.paymentGooglePay}</span>
                  </div>
                  <span className="text-xs text-gray-400">One-Tap</span>
                </button>
              </div>
            ) : paymentMethod === 'stripe' ? (
              /* Simulated Credit Card form details */
              <form onSubmit={handlePaymentSubmit} className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Detalhes do Cartão Simulado</p>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod(null)}
                    className="text-xs text-gray-500 hover:underline cursor-pointer"
                  >
                    Retroceder
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">Nome no Cartão</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maria Santos"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">Número do Cartão</label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">Validade (MM/AA)</label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">CVC</label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        maxLength={4}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-6 py-3 rounded-xl font-bold text-sm bg-brand-gold text-brand-dark hover:bg-brand-gold-light disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando pagamento simulado...</span>
                    </>
                  ) : (
                    <span>Efetuar Pagamento Simulado de €{plans[selectedPlan].price}</span>
                  )}
                </button>
              </form>
            ) : null}

            {/* Simulated instant sheet loading overlay */}
            {isProcessing && paymentMethod !== 'stripe' && (
              <div className="absolute inset-0 bg-white/90 dark:bg-brand-charcoal/90 z-20 flex flex-col justify-center items-center p-6 text-center animate-fade-in">
                <Loader2 className="w-10 h-10 animate-spin text-brand-gold mb-3" />
                <h4 className="font-serif font-bold text-lg">A autenticar transação...</h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1">Ligar de forma segura à infraestrutura de pagamentos {paymentMethod?.toUpperCase()} sandbox.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
