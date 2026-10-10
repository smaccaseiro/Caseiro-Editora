import { X, Shield, FileText, Lock, Globe } from 'lucide-react';

interface InfoModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

export default function InfoModals({
  type,
  onClose,
}: InfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-brand-darker/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-brand-gray/30 dark:border-brand-medium/20 z-10 animate-fade-in text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-brand-gray/20 dark:border-brand-medium/10 flex items-center space-x-3 bg-brand-light dark:bg-brand-dark/25">
          <div className="p-2.5 rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
            {type === 'privacy' ? <Shield className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold">
              {type === 'privacy' ? 'Política de Privacidade' : 'Termos e Condições de Uso'}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Última actualização: Julho de 2026</p>
          </div>
        </div>

        {/* Modal Prose Content */}
        <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {type === 'privacy' ? (
            <>
              <p className="font-semibold text-brand-dark dark:text-white">1. Recolha de Informações Pessoais</p>
              <p>Na Caseiro Editora, valorizamos imensamente a privacidade dos nossos leitores. Recolhemos apenas os dados estritamente necessários para o funcionamento e faturamento da sua assinatura, tais como o seu nome completo, endereço de correio eletrónico e preferências de leitura de e-books.</p>
              
              <p className="font-semibold text-brand-dark dark:text-white">2. Processamento e Segurança dos Pagamentos</p>
              <p>Todas as transações de faturamento (via Stripe, PayPal, Apple Pay ou Google Pay) são processadas por canais encriptados certificados de segurança PCI-DSS. A Caseiro Editora não armazena dados de cartões de crédito ou detalhes bancários sensíveis nos seus servidores.</p>
              
              <p className="font-semibold text-brand-dark dark:text-white">3. Utilização de Cookies e Preferências de Idioma</p>
              <p>Utilizamos cookies estritamente necessários para manter a sua sessão de utilizador ativa, lembrar as suas preferências de idioma (Português, Inglês, Alemão, Espanhol, Francês e Italiano) e memorizar o progresso de leitura ("Continuar leitura") nos seus e-books descarregados.</p>

              <p className="font-semibold text-brand-dark dark:text-white">4. Direitos dos Utilizadores</p>
              <p>Tem o direito de solicitar a exportação ou a eliminação definitiva de todos os seus dados da nossa biblioteca digital de forma imediata em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-brand-dark dark:text-white">1. Propriedade Intelectual e Licenciamento</p>
              <p>Todo o catálogo de e-books, capas digitais, imagens e materiais disponibilizados na Caseiro Editora são propriedade intelectual protegida por direitos de autor nacionais e internacionais. A subscrição premium ativa outorga uma licença de utilização individual, intransmissível e temporária para fins exclusivos de leitura.</p>
              
              <p className="font-semibold text-brand-dark dark:text-white">2. Utilização Justa e Proibições</p>
              <p>É estritamente proibido extrair, redistribuir, modificar, piratear, partilhar ou comercializar os ficheiros PDF e EPUB descarregados da biblioteca fora do ecossistema do leitor integrado da Caseiro Editora.</p>
              
              <p className="font-semibold text-brand-dark dark:text-white">3. Renovação Recorrente e Cancelamentos</p>
              <p>Ao assinar o plano Mensal (€6,99) ou Anual (€59,99), aceita que as cobranças se repitam de forma recorrente e automática ao final do período de faturação respetivo. Pode cancelar a sua assinatura em qualquer momento através do seu painel e as funcionalidades premium manter-se-ão até à expiração do prazo já liquidado.</p>

              <p className="font-semibold text-brand-dark dark:text-white">4. Limitação de Responsabilidade</p>
              <p>A Caseiro Editora reserva-se o direito de atualizar o seu catálogo de e-books, categorias e funcionalidades literárias sem aviso prévio para fins de otimização de serviço.</p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-brand-gray/20 dark:border-brand-medium/10 flex justify-end bg-brand-light/35 dark:bg-brand-dark/15">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-xs shadow-md transition-all"
          >
            Compreendi
          </button>
        </div>

      </div>
    </div>
  );
}
