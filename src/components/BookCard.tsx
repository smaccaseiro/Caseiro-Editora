import { MouseEvent } from 'react';
import { Book, TranslationSet } from '../types';
import { Lock, FileText, Heart, Eye } from 'lucide-react';

interface BookCardProps {
  key?: string | number;
  book: Book;
  t: TranslationSet;
  isSubscribed: boolean;
  isFavorite: boolean;
  onToggleFavorite: (e: MouseEvent, bookId: string) => void;
  onSelect: (book: Book) => void;
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
  onSubscribe,
}: BookCardProps) {
  const flag = flagMap[book.language] || '🌐';

  return (
    <div 
      className="group relative flex flex-col rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-brand-charcoal border border-brand-gray/40 dark:border-brand-medium/20 text-left cursor-pointer transform hover:-translate-y-1.5"
      onClick={() => onSelect(book)}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-dark">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Favorite Star Button */}
        <button
          onClick={(e) => onToggleFavorite(e, book.id)}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-black/55 backdrop-blur-md text-white hover:text-brand-gold hover:scale-110 active:scale-95 transition-all shadow-md z-10"
          title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-brand-gold text-brand-gold' : 'text-white'}`} />
        </button>

        {/* Language Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/55 backdrop-blur-md text-xs font-semibold text-white shadow-md z-10 flex items-center space-x-1">
          <span>{flag}</span>
          <span className="uppercase text-[10px]">{book.language}</span>
        </div>

        {/* Lock Overlay for non-subscribed users */}
        {!isSubscribed && (
          <div className="absolute inset-0 bg-brand-dark/75 backdrop-blur-[2px] flex flex-col justify-center items-center p-4 text-center transition-all opacity-0 group-hover:opacity-100 duration-300">
            <div className="p-3 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 mb-3 animate-bounce">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-white font-serif text-sm font-semibold mb-2">{t.locked}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubscribe();
              }}
              className="px-4 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-brand-dark text-xs font-bold transition-colors shadow-md"
            >
              {t.subscribeToUnlock}
            </button>
          </div>
        )}

        {/* Bottom Fast Stats */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-medium/90 border border-brand-gold/30 text-brand-gold">
            {book.category}
          </span>
          <span className="flex items-center space-x-1 text-[11px] font-medium bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs">
            <FileText className="w-3.5 h-3.5 text-brand-gold" />
            <span>{book.pages} pág.</span>
          </span>
        </div>
      </div>

      {/* Book Metadata details */}
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
            className="flex items-center space-x-1.5 text-xs font-bold text-brand-medium dark:text-brand-gold hover:underline group/btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(book);
            }}
          >
            <span>{t.viewDetails}</span>
            <Eye className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
}
