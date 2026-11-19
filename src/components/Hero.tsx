import { Book, TranslationSet } from '../types';
import { Play, Calendar, Clock, Lock, BookOpen, Sparkles } from 'lucide-react';

interface HeroProps {
  featuredBook: Book | undefined;
  t: TranslationSet;
  isSubscribed: boolean;
  onReadBook: (book: Book, sampleMode?: boolean) => void;
  onSubscribe: () => void;
  onExplore: () => void;
}

export default function Hero({
  featuredBook,
  t,
  isSubscribed,
  onReadBook,
  onSubscribe,
  onExplore,
}: HeroProps) {
  if (!featuredBook) {
    return (
      <div className="relative overflow-hidden bg-brand-dark text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-brand-medium/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-medium/60 via-brand-dark to-brand-darker opacity-80" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-1.5 text-brand-gold text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biblioteca Digital Editorial</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
            {t.tagline}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {t.heroSub}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              type="button"
              onClick={onExplore}
              className="px-8 py-3.5 rounded-lg bg-brand-gold text-brand-dark font-semibold text-base hover:bg-brand-gold-light hover:shadow-lg transition-all cursor-pointer"
            >
              {t.getStarted}
            </button>
            <button
              type="button"
              onClick={onSubscribe}
              className="px-8 py-3.5 rounded-lg bg-transparent border-2 border-brand-gold text-brand-gold font-semibold text-base hover:bg-brand-gold/10 transition-all cursor-pointer"
            >
              {t.subscribeNow}
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  const coverSrc = featuredBook.coverUrl || '/default-cover.jpg';

  return (
    <div className="relative overflow-hidden bg-brand-dark border-b border-brand-medium/40 min-h-[500px] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter blur-[3px] opacity-25"
        style={{ backgroundImage: `url(${coverSrc})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-darker via-brand-dark/95 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-brand-darker/60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
              Destaque Editorial · {featuredBook.category} · {getFlagEmoji(featuredBook.language)} {featuredBook.language.toUpperCase()}
            </p>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              {featuredBook.title}
            </h1>

            <p className="text-brand-gold-light font-medium text-base sm:text-lg">
              {t.author}: <span className="text-white">{featuredBook.author}</span>
            </p>

            <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none">
              {featuredBook.description}
            </p>

            <div className="flex items-center space-x-6 text-xs text-gray-300 font-mono">
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-brand-gold" />
                <span>{featuredBook.publishedYear}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-brand-gold" />
                <span>{featuredBook.pages} {t.pagesAbbrev}</span>
              </span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {isSubscribed ? (
                <button
                  id="featured-read-btn"
                  type="button"
                  onClick={() => onReadBook(featuredBook, false)}
                  className="px-8 py-4 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-brand-dark" />
                  <span>{t.continueReading}</span>
                </button>
              ) : (
                <>
                  <button
                    id="featured-sample-btn"
                    type="button"
                    onClick={() => onReadBook(featuredBook, true)}
                    className="px-8 py-4 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-base shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>{t.readSample}</span>
                  </button>
                  <button
                    id="featured-subscribe-btn"
                    type="button"
                    onClick={onSubscribe}
                    className="px-6 py-4 rounded-xl bg-brand-medium/50 hover:bg-brand-medium/80 border border-brand-gold/40 text-white font-semibold text-base transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-brand-gold" />
                    <span>{t.subscribeToUnlock}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:flex justify-center items-center">
            <div className="relative group perspective-1000">
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-gold/30 to-brand-medium/30 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative select-none w-64 h-96 rounded-r-xl overflow-hidden shadow-2xl border border-white/10 bg-brand-medium">
                <img
                  src={coverSrc}
                  alt={featuredBook.title}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-black/50 via-white/15 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
