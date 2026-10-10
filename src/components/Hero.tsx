import { Book, TranslationSet } from '../types';
import { Play, Calendar, Clock, Lock, Sparkles } from 'lucide-react';

interface HeroProps {
  featuredBook: Book | undefined;
  t: TranslationSet;
  isSubscribed: boolean;
  onReadBook: (book: Book) => void;
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
    // Elegant fallback banner
    return (
      <div className="relative overflow-hidden bg-brand-dark text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-brand-medium/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-medium/60 via-brand-dark to-brand-darker opacity-80" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Biblioteca Premium</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white">
            {t.tagline}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {t.heroSub}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onExplore}
              className="px-8 py-3.5 rounded-lg bg-brand-gold text-brand-dark font-semibold text-base hover:bg-brand-gold-light hover:shadow-lg hover:shadow-brand-gold/20 transition-all transform hover:-translate-y-0.5"
            >
              {t.getStarted}
            </button>
            <button
              onClick={onSubscribe}
              className="px-8 py-3.5 rounded-lg bg-transparent border-2 border-brand-gold text-brand-gold font-semibold text-base hover:bg-brand-gold/10 transition-all"
            >
              {t.subscribeNow}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Language flag helper
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

  return (
    <div className="relative overflow-hidden bg-brand-dark border-b border-brand-medium/40 min-h-[500px] flex items-center">
      {/* Background Cinematic Artwork Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter blur-[3px] opacity-25"
        style={{ backgroundImage: `url(${featuredBook.coverUrl})` }}
      />
      {/* Multi-layered custom gradient overlay for authentic Netflix-vibe */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-darker via-brand-dark/95 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-brand-darker/60" />

      {/* Main Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text/CTA Area */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-brand-gold text-brand-dark text-[10px] uppercase tracking-wider font-extrabold shadow-md">
                Destaque
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs bg-brand-medium/70 text-brand-gold-light border border-brand-gold/20 font-medium">
                {featuredBook.category}
              </span>
              <span className="text-sm">
                {getFlagEmoji(featuredBook.language)} {featuredBook.language.toUpperCase()}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              {featuredBook.title}
            </h1>

            <p className="text-brand-gold-light font-medium text-base sm:text-lg">
              {t.author}: <span className="text-white hover:underline cursor-pointer">{featuredBook.author}</span>
            </p>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none">
              {featuredBook.description}
            </p>

            <div className="flex items-center space-x-6 text-xs text-gray-400">
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
                  onClick={() => onReadBook(featuredBook)}
                  className="px-8 py-4 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-base shadow-lg hover:shadow-brand-gold/30 transition-all flex items-center justify-center space-x-2.5 transform hover:-translate-y-0.5"
                >
                  <Play className="w-5 h-5 fill-brand-dark" />
                  <span>{t.continueReading}</span>
                </button>
              ) : (
                <>
                  <button
                    id="featured-subscribe-btn"
                    onClick={onSubscribe}
                    className="px-8 py-4 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-base shadow-lg hover:shadow-brand-gold/30 transition-all flex items-center justify-center space-x-2.5 transform hover:-translate-y-0.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{t.subscribeToUnlock}</span>
                  </button>
                  <button
                    id="featured-details-btn"
                    onClick={onExplore}
                    className="px-6 py-4 rounded-xl bg-brand-medium/40 hover:bg-brand-medium/70 border border-brand-gold/20 text-white font-semibold text-base transition-all text-center"
                  >
                    {t.viewDetails}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Book 3D Mockup Cover Area */}
          <div className="hidden lg:col-span-5 lg:flex justify-center items-center">
            <div className="relative group perspective-1000">
              {/* Premium 3D Book shadow / stack effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-gold/30 to-brand-medium/30 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative select-none w-64 h-96 rounded-r-xl overflow-hidden shadow-2xl transform rotate-y-[-10deg] rotate-x-[5deg] group-hover:rotate-y-[0deg] group-hover:rotate-x-[0deg] transition-all duration-700 border-l border-brand-charcoal/40 ring-1 ring-white/10">
                <img
                  src={featuredBook.coverUrl}
                  alt={featuredBook.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Book spine effect */}
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
