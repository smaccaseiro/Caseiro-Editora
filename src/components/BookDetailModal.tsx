import { Book, TranslationSet } from '../types';
import { X, Play, Download, Lock, Heart, Star, BookMarked, Layers, BookOpen } from 'lucide-react';

interface BookDetailModalProps {
  book: Book;
  t: TranslationSet;
  isSubscribed: boolean;
  isFavorite: boolean;
  allBooks: Book[];
  onClose: () => void;
  onSelectBook: (book: Book) => void;
  onToggleFavorite: (bookId: string) => void;
  onRead: (book: Book, sampleMode?: boolean) => void;
  onSubscribe: () => void;
  onDownload: (book: Book, format?: 'pdf' | 'epub') => void;
}

export default function BookDetailModal({
  book,
  t,
  isSubscribed,
  isFavorite,
  allBooks,
  onClose,
  onSelectBook,
  onToggleFavorite,
  onRead,
  onSubscribe,
  onDownload,
}: BookDetailModalProps) {
  const recommendations = allBooks
    .filter((b) => b.category === book.category && b.id !== book.id)
    .slice(0, 3);

  const getFlagEmoji = (lang: string) => {
    switch (lang) {
      case 'pt': return '🇵🇹';
      case 'en': return '🇬🇧';
      case 'de': return '🇩🇪';
      case 'es': return '🇪🇸';
      case 'fr': return '🇫🇷';
      case 'it': return '🇮🇹';
      default: return '🌐';
    }
  };

  const coverSrc = book.coverUrl || '/default-cover.jpg';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div
        className="fixed inset-0 bg-brand-darker/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-brand-gray/30 dark:border-brand-medium/20 z-10 animate-fade-in flex flex-col md:flex-row text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white hover:scale-105 transition-all z-20 shadow-md cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side Cover */}
        <div className="md:w-5/12 bg-brand-dark flex items-center justify-center p-8 relative min-h-[300px] md:min-h-0">
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-20"
            style={{ backgroundImage: `url(${coverSrc})` }}
          />
          <div className="relative w-48 sm:w-56 aspect-[3/4] shadow-2xl rounded-xl overflow-hidden border border-white/10">
            <img
              src={coverSrc}
              alt={book.title}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right Side Details */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-medium dark:text-brand-gold mb-2">
              {book.category} · {getFlagEmoji(book.language)} {book.language.toUpperCase()} · {book.pages} {t.pagesAbbrev}
            </p>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark dark:text-white leading-tight mb-2">
              {book.title}
            </h2>

            <p className="text-brand-medium dark:text-brand-gold font-semibold text-sm mb-4">
              {t.author}: <span className="text-brand-dark dark:text-brand-gold-light">{book.author}</span>
            </p>

            <div className="border-t border-brand-gray/30 dark:border-brand-medium/15 pt-4 mt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Sinopse</h4>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {book.description}
              </p>
            </div>

            <div className="flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-400 mt-5 bg-brand-light dark:bg-brand-dark/25 p-3 rounded-xl border border-brand-gray/40 dark:border-brand-medium/10">
              <span className="flex items-center space-x-1.5">
                <BookMarked className="w-4 h-4 text-brand-gold" />
                <span>Ano: {book.publishedYear}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-brand-gold" />
                <span>Formato: Leitor Web · PDF · EPUB</span>
              </span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-brand-gray/30 dark:border-brand-medium/15">
            {isSubscribed ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onRead(book, false);
                      onClose();
                    }}
                    className="flex-grow flex items-center justify-center space-x-2 px-6 py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-brand-dark" />
                    <span>Ler E-Book Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFavorite(book.id)}
                    className="px-4 py-3.5 rounded-xl border border-brand-medium/30 hover:bg-brand-medium/10 text-brand-medium dark:text-brand-gold transition-colors cursor-pointer"
                    title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-brand-gold text-brand-gold' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onDownload(book, 'pdf')}
                    className="flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-semibold bg-brand-medium/10 hover:bg-brand-medium/20 text-brand-medium dark:text-brand-gold-light transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Descarregar PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload(book, 'epub')}
                    className="flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-semibold bg-brand-medium/10 hover:bg-brand-medium/20 text-brand-medium dark:text-brand-gold-light transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Descarregar EPUB</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-brand-dark border border-brand-gold/30 text-white space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-brand-gold/15 text-brand-gold border border-brand-gold/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold font-serif text-brand-gold-light">Amostra Gratuita Disponível</h5>
                    <p className="text-xs text-gray-300">
                      Leia os primeiros capítulos gratuitamente ou subscreva por €3,99/mês para desbloquear toda a obra e efetuar downloads.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onRead(book, true);
                      onClose();
                    }}
                    className="py-3 px-4 bg-white/15 hover:bg-white/25 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-brand-gold" />
                    <span>{t.readSample}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSubscribe();
                      onClose();
                    }}
                    className="py-3 px-4 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-brand-dark text-brand-dark" />
                    <span>{t.subscribeToUnlock}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-brand-gray/30 dark:border-brand-medium/15">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Recomendados para Si</h5>
              <div className="grid grid-cols-3 gap-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onSelectBook(rec)}
                    className="group cursor-pointer text-left space-y-1"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-brand-dark shadow-md border border-brand-gray/20">
                      <img
                        src={rec.coverUrl || '/default-cover.jpg'}
                        alt={rec.title}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="font-serif font-bold text-xs truncate text-brand-dark dark:text-white mt-1 group-hover:text-brand-medium dark:group-hover:text-brand-gold">
                      {rec.title}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{rec.author}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
