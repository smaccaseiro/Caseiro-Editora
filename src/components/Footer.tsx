import { useState, FormEvent } from 'react';
import { Mail, Send, CheckCircle, HelpCircle, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { TranslationSet } from '../types';

interface FooterProps {
  t: TranslationSet;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export default function Footer({
  t,
  onOpenPrivacy,
  onOpenTerms,
}: FooterProps) {
  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // FAQ accordion state
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 4000);
    }
  };

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMsg) {
      setContactSubmitted(true);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setTimeout(() => setContactSubmitted(false), 4000);
    }
  };

  const faqItems = [
    {
      q: 'Como funciona a assinatura da Caseiro Editora?',
      a: 'A assinatura funciona como uma mensalidade de streaming (estilo Netflix). Ao assinar o plano Mensal (€3,99) ou o plano Anual (€29,99), ganha acesso imediato e ilimitado para ler e descarregar qualquer livro do catálogo em todos os 6 idiomas suportados.'
    },
    {
      q: 'Posso ler os livros de forma offline?',
      a: 'Sim! Com o plano ativo, pode carregar qualquer e-book e efetuar o download direto para o seu painel de utilizador. Isto permite-lhe ler as obras mesmo sem ligação à Internet através do nosso leitor digital integrado.'
    },
    {
      q: 'Quais os formatos de ficheiro disponíveis?',
      a: 'Todos os nossos e-books estão disponíveis em PDF e EPUB premium otimizados, garantindo compatibilidade total tanto com o nosso leitor web integrado como com leitores externos como Kindle, Kobo ou Apple Books.'
    },
    {
      q: 'Existe fidelização? Como posso cancelar a assinatura?',
      a: 'Não existe qualquer fidelização. Pode cancelar a sua assinatura em qualquer momento com um único clique no seu Painel de Utilizador ("A minha conta"). O seu acesso permanecerá ativo até ao final do período já pago.'
    },
    {
      q: 'Como é feita a cobrança das assinaturas?',
      a: 'As assinaturas são cobradas de forma recorrente (mensal ou anualmente, conforme o plano escolhido) através de métodos de pagamento seguros encriptados como Stripe (Cartão de Crédito), PayPal, Apple Pay ou Google Pay.'
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
              <span className="text-[10px] uppercase bg-brand-gold text-brand-dark px-1.5 py-0.5 rounded font-extrabold font-mono">Premium</span>
            </div>
            <p className="text-sm text-gray-100 leading-relaxed max-w-sm">
              {t.heroSub}
            </p>

            {/* Newsletter form with feedback banner */}
            <div className="pt-4 space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-brand-gold">{t.newsletter}</h5>
              <p className="text-xs text-gray-200 font-medium">{t.newsletterSub}</p>

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
                    className="px-3.5 py-2 bg-brand-gold text-brand-dark hover:bg-brand-gold-light rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div id="faq" className="lg:col-span-5 space-y-4 scroll-mt-20">
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
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs sm:text-sm font-bold hover:bg-brand-medium/20 text-white text-left transition-colors"
                  >
                    <span>{item.q}</span>
                    {faqOpen === index ? <ChevronUp className="w-4 h-4 text-brand-gold" /> : <ChevronDown className="w-4 h-4 text-brand-gold" />}
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
          <div id="contact" className="lg:col-span-3 space-y-4 scroll-mt-20">
            <h5 className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center space-x-1.5">
              <Mail className="w-4 h-4" />
              <span>{t.contact}</span>
            </h5>

            {contactSubmitted ? (
              <div className="p-4 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/35 text-xs text-center space-y-2 animate-fade-in">
                <CheckCircle className="w-5 h-5 mx-auto text-brand-gold" />
                <h6 className="font-bold">Mensagem Enviada!</h6>
                <p className="text-xs text-gray-200">Entraremos em contacto num prazo máximo de 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-2.5">
                <input
                  type="text"
                  required
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
                  placeholder="A sua mensagem literária ou dúvida..."
                  rows={3}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-charcoal text-white placeholder-gray-400 border border-brand-medium/55 rounded-lg text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-xs rounded-lg transition-all"
                >
                  Enviar Mensagem
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Global Footer bottom copyright and terms */}
        <div className="mt-12 pt-6 border-t border-brand-medium/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-200">
          <p className="font-medium text-gray-200">© {new Date().getFullYear()} Caseiro Editora Limitada. Todos os direitos reservados.</p>
          <div className="flex space-x-6 font-medium">
            <button 
              onClick={onOpenPrivacy}
              className="text-gray-200 hover:text-brand-gold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-brand-gold" />
              <span>{t.privacyPolicy}</span>
            </button>
            <button 
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
