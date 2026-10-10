import { useState, useEffect, FormEvent } from 'react';
import { X, ChevronLeft, ChevronRight, Type, BookOpen, Search, Maximize, Sun, Eye, Landmark } from 'lucide-react';
import { Book } from '../types';

interface ReaderModalProps {
  book: Book;
  initialPage: number;
  onClose: (currentPage: number, progress: number) => void;
}

export default function ReaderModal({
  book,
  initialPage = 0,
  onClose,
}: ReaderModalProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ pageIndex: number; text: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const pages = book.content && book.content.length > 0 
    ? book.content 
    : [
        'Página 1: Este é o conteúdo padrão deste fantástico e-book disponibilizado pela Caseiro Editora. Carregado com um layout premium confortável aos olhos do leitor.',
        'Página 2: Descubra mais aventuras sobre esta fantástica obra literária. Leia no seu telemóvel, tablet ou computador.',
        'Página 3: A assinatura premium garante-lhe acesso instantâneo e livre a todo o catálogo internacional com capas clássicas inspiradas na Kindle Store.',
        'Página 4: Fim da leitura. Esperamos que tenha gostado! Continue a descobrir novos livros nas nossas secções recomendadas.'
      ];

  const totalPages = pages.length;

  // Handle keys for page flips
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    const progressPercent = Math.round(((currentPage + 1) / totalPages) * 100);
    onClose(currentPage, progressPercent);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results: { pageIndex: number; text: string }[] = [];
    pages.forEach((pageText, index) => {
      if (pageText.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({ pageIndex: index, text: pageText });
      }
    });
    setSearchResults(results);
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'light': return 'bg-white text-gray-900';
      case 'dark': return 'bg-brand-darker text-gray-100';
      case 'sepia': return 'bg-[#f4eccf] text-[#4a3b1a]';
      default: return 'bg-white';
    }
  };

  const getFontClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm sm:text-base';
      case 'md': return 'text-base sm:text-lg';
      case 'lg': return 'text-lg sm:text-xl';
      case 'xl': return 'text-xl sm:text-2xl';
      default: return 'text-base';
    }
  };

  // Helper to highlight searched term in text
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() 
            ? <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col ${getThemeClass()} transition-colors duration-200`}>
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/10 dark:border-white/10 shadow-sm z-10 bg-black/5 dark:bg-white/5 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-brand-gold" />
          <div className="max-w-[200px] sm:max-w-md truncate">
            <h4 className="font-serif font-bold text-sm sm:text-base truncate leading-tight">{book.title}</h4>
            <p className="text-[11px] opacity-75">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Pesquisar no texto"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Switcher Button Grid */}
          <div className="flex items-center bg-black/10 dark:bg-white/10 p-0.5 rounded-lg border border-black/5">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md ${theme === 'light' ? 'bg-white text-gray-900 shadow-xs' : 'opacity-70'}`}
              title="Modo Claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-md ${theme === 'sepia' ? 'bg-[#dfd4ab] text-[#4a3b1a] shadow-xs' : 'opacity-70'}`}
              title="Modo Sépia"
            >
              <Landmark className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md ${theme === 'dark' ? 'bg-brand-dark text-white shadow-xs' : 'opacity-70'}`}
              title="Modo Escuro"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font size adjustments */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 text-xs rounded-md border ${fontSize === 'sm' ? 'bg-black/10 border-black/20 dark:bg-white/10' : 'border-transparent'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2 py-1 text-sm rounded-md border ${fontSize === 'md' ? 'bg-black/10 border-black/20 dark:bg-white/10 font-bold' : 'border-transparent'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 text-base rounded-md border ${fontSize === 'lg' ? 'bg-black/10 border-black/20 dark:bg-white/10 font-bold' : 'border-transparent'}`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xl')}
              className={`px-2 py-1 text-lg rounded-md border ${fontSize === 'xl' ? 'bg-black/10 border-black/20 dark:bg-white/10 font-bold' : 'border-transparent'}`}
            >
              A++
            </button>
          </div>

          {/* Close Reader */}
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-brand-gold hover:bg-brand-gold-light text-brand-dark shadow-sm transition-transform active:scale-95"
            title="Fechar Livro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Reader Stage (Centered Book Page Layout) */}
      <div className="flex-grow flex relative overflow-hidden">
        {/* Search Panel Overlay */}
        {searchOpen && (
          <div className="absolute top-0 right-0 h-full w-80 max-w-full bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 z-30 shadow-2xl border-l border-brand-gray/30 dark:border-brand-medium/20 flex flex-col p-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-brand-gray/20 dark:border-brand-medium/10">
              <h5 className="font-bold text-sm">Pesquisar no Livro</h5>
              <button onClick={() => setSearchOpen(false)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Introduza uma palavra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow px-3 py-1.5 rounded-lg border border-brand-gray/55 dark:border-brand-medium/25 text-xs bg-transparent"
              />
              <button type="submit" className="px-3 py-1.5 bg-brand-gold text-brand-dark rounded-lg text-xs font-bold">
                Ir
              </button>
            </form>

            <div className="flex-grow overflow-y-auto mt-4 space-y-2.5">
              {searchResults.length > 0 ? (
                <>
                  <p className="text-[11px] text-gray-400">{searchResults.length} correspondências encontradas:</p>
                  {searchResults.map((res, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentPage(res.pageIndex);
                        setSearchOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-brand-light dark:bg-brand-dark/20 text-xs border border-transparent hover:border-brand-gold transition-all"
                    >
                      <p className="font-bold text-brand-medium dark:text-brand-gold mb-1">Pág. {res.pageIndex + 1}</p>
                      <p className="line-clamp-2 text-gray-500 dark:text-gray-400 font-serif italic">"{res.text}"</p>
                    </button>
                  ))}
                </>
              ) : searchQuery ? (
                <p className="text-center text-xs text-gray-400 pt-8">Nenhum resultado encontrado.</p>
              ) : (
                <p className="text-center text-xs text-gray-400 pt-8">Digite um termo acima para iniciar a busca.</p>
              )}
            </div>
          </div>
        )}

        {/* Previous page margin clickable trigger */}
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="hidden md:flex items-center justify-center w-20 h-full hover:bg-black/3 dark:hover:bg-white/3 transition-colors disabled:opacity-0"
          title="Página Anterior"
        >
          <ChevronLeft className="w-8 h-8 opacity-65 group-hover:scale-115" />
        </button>

        {/* The Page Container itself (looks like a physical open book sheet) */}
        <div className="flex-grow flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto bg-opacity-40 rounded-xl py-6 px-4 sm:px-10 leading-relaxed font-serif text-center md:text-left select-text">
            {/* Top Chapter Indicator */}
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-black/10 dark:border-white/10 opacity-60 text-xs font-serif tracking-widest uppercase">
              <span>{book.title}</span>
              <span>Capítulo {currentPage + 1}</span>
            </div>

            {/* Simulated Page Text Content */}
            <div className={`reader-page ${getFontClass()} indent-8 leading-loose tracking-wide first-letter:text-4xl first-letter:font-bold first-letter:mr-2`}>
              {highlightText(pages[currentPage], searchQuery)}
            </div>

            {/* Bottom Book Page Footnote */}
            <div className="mt-12 pt-4 border-t border-black/10 dark:border-white/10 opacity-55 text-center text-xs">
              {currentPage + 1} de {totalPages}
            </div>
          </div>
        </div>

        {/* Next page margin clickable trigger */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className="hidden md:flex items-center justify-center w-20 h-full hover:bg-black/3 dark:hover:bg-white/3 transition-colors disabled:opacity-0"
          title="Próxima Página"
        >
          <ChevronRight className="w-8 h-8 opacity-65" />
        </button>
      </div>

      {/* Bottom Footer Navigation Bar */}
      <div className="border-t border-black/10 dark:border-white/10 py-3.5 px-4 sm:px-6 flex items-center justify-between bg-black/5 dark:bg-white/5 z-10 select-none">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-semibold disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <div className="flex items-center space-x-3 text-xs w-2/5 sm:w-1/3">
          <input
            type="range"
            min="0"
            max={totalPages - 1}
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value))}
            className="flex-grow accent-brand-gold cursor-pointer"
          />
          <span className="font-mono text-xs opacity-75">{Math.round(((currentPage + 1) / totalPages) * 100)}%</span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-semibold disabled:opacity-30"
        >
          <span>Seguinte</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
