import { useState, FormEvent } from 'react';
import { Mail, Send, CheckCircle, HelpCircle, Shield, FileText, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { AppLanguage, TranslationSet } from '../types';
import { submitContactMessageToFirestore, subscribeNewsletterInFirestore } from '../firebase';

interface FooterProps {
  t: TranslationSet;
  currentLang: AppLanguage;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export default function Footer({
  t,
  currentLang,
  onOpenPrivacy,
  onOpenTerms,
}: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed) return;

    setNewsletterLoading(true);
    setNewsletterError('');

    try {
      await Promise.allSettled([
        subscribeNewsletterInFirestore(trimmed, currentLang),
        fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, language: currentLang }),
        }),
      ]);

      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    } catch {
      setNewsletterError('Não foi possível registar o email. Tente novamente.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || contactMsg.trim().length < 5) {
      setContactError('Por favor, preencha todos os campos (mensagem com mínimo de 5 caracteres).');
      return;
    }

    setContactLoading(true);
    setContactError('');

    try {
      await Promise.allSettled([
        submitContactMessageToFirestore(contactName, contactEmail, contactMsg),
        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: contactName.trim(),
            email: contactEmail.trim(),
            message: contactMsg.trim(),
          }),
        }),
      ]);

      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setTimeout(() => setContactSubmitted(false), 5000);
    } catch {
      setContactError('Não foi possível enviar a mensagem neste momento.');
    } finally {
      setContactLoading(false);
    }
  };

  const faqItems = [
    {
      q: 'Como funciona a assinatura da Caseiro Editora?',
      a: 'A assinatura funciona como uma mensalidade de streaming. Ao assinar o plano Mensal (€3,99) ou o plano Anual (€29,99), ganha acesso imediato e ilimitado para ler e descarregar qualquer livro do catálogo em todos os 6 idiomas suportados.'
    },
    {
      q: 'Posso ler os livros de forma offline?',
      a: 'Sim! Com o plano ativo, pode instalar a aplicação (PWA) ou efetuar o download em PDF e EPUB para ler as obras mesmo sem ligação à Internet.'
    },
    {
      q: 'Posso experimentar um livro antes de assinar?',
      a: 'Sim! Em qualquer livro do catálogo pode clicar em "Ler Amostra" para ler gratuitamente os primeiros capítulos antes de decidir assinar.'
    },
    {
      q: 'Existe fidelização? Como posso cancelar a assinatura?',
      a: 'Não existe qualquer fidelização. Pode cancelar a sua assinatura em qualquer momento no seu Painel de Utilizador ("A minha conta").'
    },
    {
      q: 'Como é feita a cobrança das assinaturas?',
      a: 'As assinaturas são cobradas de forma recorrente (mensal ou anual) exclusivamente através do checkout encriptado oficial do Stripe (Cartão, Apple Pay e Google Pay).'
    }
  ];

  return (
    <footer className="bg-brand-dark text-white border-t border-brand-medium/40 mt-16 select-text text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Brand & Newsletter Section */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-2.5">
              <span className="font-serif text-2xl font-bold text-white tracking-wide">{t.brand}</span>
              <span className="text-[10px] uppercase text-brand-gold font-extrabold font-mono">· Premium</span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed max-w-sm">
              {t.heroSub}
            </p>

            <div className="pt-4 space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-brand-gold">{t.newsletter}</h5>
              <p className="text-xs text-gray-200 font-medium">{t.newsletterSub}</p>

              {newsletterError && (
                <div className="p-2.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{newsletterError}</span>
                </div>
              )}

              {newsletterSubscribed ? (
                <div className="p-3 rounded-lg bg-brand-gold/15 text-brand-gold border border-brand-gold/20 text-xs flex items-center space-x-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{t.newsletterSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="O seu email principal..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-grow px-3 py-2 bg-brand-charcoal text-white placeholder-gray-400 border border-brand-medium/55 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="px-3.5 py-2 bg-brand-gold text-brand-dark hover:bg-brand-gold-light rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                  >
                    {newsletterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div id="faq" className="lg:col-span-5 space-y-4 scroll-mt-24">
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>{t.faq}</span>
            </h5>

            <div className="space-y-2">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-brand-medium/35 bg-brand-charcoal/30 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs sm:text-sm font-bold hover:bg-brand-medium/20 text-white text-left transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    {faqOpen === index ? <ChevronUp className="w-4 h-4 text-brand-gold shrink-0" /> : <ChevronDown className="w-4 h-4 text-brand-gold shrink-0" />}
                  </button>

                  {faqOpen === index && (
                    <div className="px-4 pb-3.5 pt-1.5 text-xs sm:text-sm text-gray-100 leading-relaxed border-t border-brand-medium/20">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact form section */}
          <div id="contact" className="lg:col-span-3 space-y-4 scroll-mt-24">
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center space-x-1.5">
              <Mail className="w-4 h-4" />
              <span>{t.contact}</span>
            </h5>

            {contactError && (
              <div className="p-2.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{contactError}</span>
              </div>
            )}

            {contactSubmitted ? (
              <div className="p-4 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/35 text-xs text-center space-y-2 animate-fade-in">
                <CheckCircle className="w-5 h-5 mx-auto text-brand-gold" />
                <h6 className="font-bold">Mensagem Enviada!</h6>
                <p className="text-xs text-gray-200">A sua mensagem foi registada e entraremos em contacto brevemente.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-2.5">
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="Nome completo..."
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-charcoal text-white placeholder-gray-400 border border-brand-medium/55 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email de contacto..."
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-charcoal text-white placeholder-gray-400 border border-brand-medium/55 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                />
                <textarea
                  required
                  minLength={5}
                  placeholder="A sua mensagem literária ou dúvida..."
                  rows={3}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-charcoal text-white placeholder-gray-400 border border-brand-medium/55 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {contactLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{contactLoading ? 'A enviar...' : 'Enviar Mensagem'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-brand-medium/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-200">
          <p className="font-medium text-gray-200">© {new Date().getFullYear()} Caseiro Editora Limitada. Todos os direitos reservados.</p>
          <div className="flex space-x-6 font-medium">
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-gray-200 hover:text-brand-gold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-brand-gold" />
              <span>{t.privacyPolicy}</span>
            </button>
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-gray-200 hover:text-brand-gold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-brand-gold" />
              <span>{t.termsConditions}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
