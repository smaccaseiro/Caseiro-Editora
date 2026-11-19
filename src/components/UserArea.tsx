import { useState } from 'react';
import { User, Shield, Heart, BookOpen, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { UserProfile, Book, TranslationSet } from '../types';

interface UserAreaProps {
  user: UserProfile;
  t: TranslationSet;
  allBooks: Book[];
  onCancelSubscription: () => void;
  onSelectBook: (book: Book) => void;
  onReadBook: (book: Book) => void;
}

export default function UserArea({
  user,
  t,
  allBooks,
  onCancelSubscription,
  onSelectBook,
  onReadBook,
}: UserAreaProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'history' | 'downloads'>('profile');

  const favoriteBooks = allBooks.filter((b) => user.favorites.includes(b.id));
  const downloadedBooks = allBooks.filter((b) => user.downloads.includes(b.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column Navigation Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <div className="p-4 rounded-xl bg-brand-medium text-white mb-4 text-left">
            <p className="text-xs text-brand-gold font-bold uppercase tracking-widest">Utilizador</p>
            <h3 className="font-serif font-bold text-lg leading-tight mt-1">{user.name}</h3>
            <p className="text-xs text-gray-300 truncate mt-0.5">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-brand-gold text-brand-dark shadow-md'
                : 'bg-white dark:bg-brand-charcoal hover:bg-brand-medium/5 text-gray-700 dark:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>A minha conta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-brand-gold text-brand-dark shadow-md'
                : 'bg-white dark:bg-brand-charcoal hover:bg-brand-medium/5 text-gray-700 dark:text-gray-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{t.favorites} ({user.favorites.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-brand-gold text-brand-dark shadow-md'
                : 'bg-white dark:bg-brand-charcoal hover:bg-brand-medium/5 text-gray-700 dark:text-gray-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.readingHistory} ({user.readingHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-brand-gold text-brand-dark shadow-md'
                : 'bg-white dark:bg-brand-charcoal hover:bg-brand-medium/5 text-gray-700 dark:text-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{t.downloads} ({user.downloads.length})</span>
          </button>
        </div>

        {/* Right Column Details Display */}
        <div className="lg:col-span-9 bg-white dark:bg-brand-charcoal rounded-2xl p-6 sm:p-8 shadow-md border border-brand-gray/30 dark:border-brand-medium/10">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in text-left">
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl mb-1">A minha Conta</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gira o estado da sua assinatura e sincronização na nuvem.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-brand-medium/20 dark:border-brand-medium/40 bg-brand-light dark:bg-brand-dark/20 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <h4 className="text-sm font-bold text-brand-medium dark:text-brand-gold flex items-center space-x-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Subscrição Digital Premium</span>
                  </h4>
                  <div className="mt-2.5 space-y-1">
                    <p className="text-xs">
                      Estado:{' '}
                      <span className={`font-bold ${user.isSubscribed ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {user.isSubscribed ? 'Activa' : 'Inativa'}
                      </span>
                    </p>
                    {user.isSubscribed && (
                      <>
                        <p className="text-xs">
                          Plano:{' '}
                          <span className="font-bold uppercase text-brand-gold-dark dark:text-brand-gold-light">
                            {user.subscriptionPlan === 'annual' ? t.annual : t.monthly}
                          </span>
                        </p>
                        <p className="text-xs">
                          Próxima Renovação:{' '}
                          <span className="font-medium text-gray-500 dark:text-gray-400">
                            {user.subscriptionRenewal || 'N/A'}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {user.isSubscribed ? (
                  <div className="md:text-right">
                    <button
                      type="button"
                      onClick={onCancelSubscription}
                      className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {t.cancelSubscription}
                    </button>
                  </div>
                ) : (
                  <div className="md:text-right">
                    <span className="text-xs text-gray-400 block mb-1">Sem planos ativos</span>
                    <p className="text-xs font-semibold text-brand-gold">
                      Subscreva por €3,99/mês ou €29,99/ano e aceda a todos os livros!
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-gray/20 dark:border-brand-medium/10 pt-6">
                <h4 className="font-serif font-bold text-base mb-3 flex items-center space-x-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-brand-gold" />
                  <span>Segurança e Autenticação</span>
                </h4>
                <div className="p-4 rounded-xl bg-brand-light/60 dark:bg-brand-dark/25 border border-brand-gray/30 dark:border-brand-medium/20 flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-brand-dark dark:text-white">
                      Conta protegida por Google Authentication
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Os seus dados de leitura, favoritos e downloads estão sincronizados com a sua conta verificada ({user.email}).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl mb-1">{t.favorites}</h3>
                <p className="text-xs text-gray-400">Livros guardados na sua estante pessoal.</p>
              </div>

              {favoriteBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {favoriteBooks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBook(b)}
                      className="group cursor-pointer space-y-2 text-left"
                    >
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-brand-dark shadow-md border border-brand-gray/20">
                        <img
                          src={b.coverUrl || '/default-cover.jpg'}
                          alt={b.title}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-serif font-bold text-sm truncate text-brand-dark dark:text-white group-hover:text-brand-gold">
                        {b.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">{b.author}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center">Nenhum livro favorito adicionado até ao momento.</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl mb-1">{t.readingHistory}</h3>
                <p className="text-xs text-gray-400">Retome a leitura exatamente onde parou.</p>
              </div>

              {user.readingHistory.length > 0 ? (
                <div className="space-y-4">
                  {user.readingHistory.map((hist) => {
                    const matchedBook = allBooks.find((b) => b.id === hist.bookId);
                    if (!matchedBook) return null;

                    return (
                      <div
                        key={hist.bookId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-brand-gray/30 dark:border-brand-medium/15 bg-brand-light/30 dark:bg-brand-dark/10 gap-4"
                      >
                        <div className="flex items-center space-x-3.5">
                          <img
                            src={matchedBook.coverUrl || '/default-cover.jpg'}
                            alt={matchedBook.title}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
                            className="w-12 h-16 object-cover rounded shadow-md shrink-0"
                          />
                          <div>
                            <h4 className="font-serif font-bold text-sm text-brand-dark dark:text-white">{matchedBook.title}</h4>
                            <p className="text-xs text-gray-400">{matchedBook.author} · Lido {hist.progress}%</p>

                            <div className="w-48 bg-gray-200 dark:bg-brand-charcoal rounded-full h-1.5 mt-2 overflow-hidden border border-brand-gray/20">
                              <div className="bg-brand-gold h-1.5 rounded-full" style={{ width: `${hist.progress}%` }} />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onReadBook(matchedBook)}
                          className="px-4 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-xs shadow-xs text-center shrink-0 cursor-pointer"
                        >
                          Continuar
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center">Histórico de leitura vazio.</p>
              )}
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl mb-1">{t.downloads}</h3>
                <p className="text-xs text-gray-400">E-books descarregados para o seu dispositivo em formato seguro.</p>
              </div>

              {downloadedBooks.length > 0 ? (
                <div className="space-y-4">
                  {downloadedBooks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-brand-gray/30 dark:border-brand-medium/15 bg-brand-light/30 dark:bg-brand-dark/10"
                    >
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={b.coverUrl || '/default-cover.jpg'}
                          alt={b.title}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
                          className="w-12 h-16 object-cover rounded shadow-md shrink-0"
                        />
                        <div>
                          <h4 className="font-serif font-bold text-sm text-brand-dark dark:text-white">{b.title}</h4>
                          <p className="text-xs text-gray-400">{b.author} · {b.pages} {t.pagesAbbrev}</p>
                          <span className="inline-block text-[10px] font-bold text-green-500 mt-1">
                            ✓ Disponível Offline
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(b.pdfData || (b.pdfUrl && (b.pdfUrl.startsWith('/uploads/') || b.pdfUrl.startsWith('http')))) && (
                          <button
                            type="button"
                            onClick={() => {
                              const href = b.pdfData || b.pdfUrl;
                              if (!href) return;
                              const a = document.createElement('a');
                              a.href = href;
                              a.download = b.pdfName || `${b.title}.pdf`;
                              if (href.startsWith('/uploads/') || href.startsWith('http')) a.target = '_blank';
                              a.click();
                            }}
                            className="px-3 py-2 rounded-lg border border-brand-gray/30 hover:bg-brand-medium/10 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-brand-gold" />
                            <span>PDF</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onReadBook(b)}
                          className="px-4 py-2 rounded-lg bg-brand-medium hover:bg-brand-dark text-white font-semibold text-xs cursor-pointer transition-colors"
                        >
                          Ler
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-12 text-center">Nenhum download efetuado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
