import { MouseEvent } from 'react';
import { Book, TranslationSet } from '../types';
import { Lock, Heart, Eye, BookOpen } from 'lucide-react';

interface BookCardProps {
  key?: string | number;
  book: Book;
  t: TranslationSet;
  isSubscribed: boolean;
  isFavorite: boolean;
  onToggleFavorite: (e: MouseEvent, bookId: string) => void;
  onSelect: (book: Book) => void;
  onReadSample: (book: Book) => void;
  onSubscribe: () => void;
}

const flagMap: Record<string, string> = {
  pt: '🇵🇹',
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  it: '🇮🇹',
};

export default function BookCard({
  book,
  t,
  isSubscribed,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onReadSample,
  onSubscribe,
}: BookCardProps) {
  const flag = flagMap[book.language] || '🌐';

  return (
    <div
      className="group relative flex flex-col rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-brand-charcoal border border-brand-gray/40 dark:border-brand-medium/20 text-left cursor-pointer transform hover:-translate-y-1"
      onClick={() => onSelect(book)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-dark">
        <img
          src={book.coverUrl || '/default-cover.jpg'}
          alt={book.title}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        <button
          type="button"
          onClick={(e) => onToggleFavorite(e, book.id)}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-black/55 backdrop-blur-md text-white hover:text-brand-gold transition-colors shadow-md z-10 cursor-pointer"
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-brand-gold text-brand-gold' : 'text-white'}`} />
        </button>

        {!isSubscribed && (
          <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-[2px] flex flex-col justify-center items-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2.5 z-10">
            <div className="p-2.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-white font-serif text-sm font-semibold">{t.locked}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReadSample(book);
              }}
              className="w-full max-w-[180px] px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
              <span>{t.readSample}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSubscribe();
              }}
              className="w-full max-w-[180px] px-3 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-dark text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              {t.subscribeToUnlock}
            </button>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 text-white z-0 pointer-events-none">
          <p className="text-[11px] font-medium text-brand-gold-light truncate">
            {flag} {book.language.toUpperCase()} · {book.category} · {book.pages} {t.pagesAbbrev}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow justify-between">
        <div className="space-y-1.5">
          <h3 className="font-serif font-bold text-base line-clamp-1 text-brand-dark dark:text-white group-hover:text-brand-medium dark:group-hover:text-brand-gold transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">
            {t.author}: {book.author}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-200 line-clamp-2 leading-relaxed pt-1">
            {book.description}
          </p>
        </div>

        <div className="pt-3.5 border-t border-brand-gray/30 dark:border-brand-medium/20 mt-3.5 flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium text-gray-500 dark:text-gray-300">
            © {book.publishedYear}
          </span>
          <button
            type="button"
            className="flex items-center space-x-1.5 text-xs font-bold text-brand-medium dark:text-brand-gold hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(book);
            }}
          >
            <span>{t.viewDetails}</span>
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
