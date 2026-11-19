import { useState, useEffect, FormEvent } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Search, Sun, Eye, Landmark, FileText, Download, Lock, Star } from 'lucide-react';
import { Book } from '../types';

interface ReaderModalProps {
  book: Book;
  initialPage: number;
  isSampleMode?: boolean;
  maxSamplePages?: number;
  onSubscribe?: () => void;
  onClose: (currentPage: number, progress: number) => void;
}

export default function ReaderModal({
  book,
  initialPage = 0,
  isSampleMode = false,
  maxSamplePages = 2,
  onSubscribe,
  onClose,
}: ReaderModalProps) {
  const hasRealPdf =
    (typeof book.pdfData === 'string' && book.pdfData.startsWith('data:application/pdf')) ||
    (typeof book.pdfUrl === 'string' && (book.pdfUrl.startsWith('/uploads/') || book.pdfUrl.startsWith('http')));

  const pdfSource =
    (book.pdfData && book.pdfData.startsWith('data:') ? book.pdfData : undefined) ||
    (book.pdfUrl && (book.pdfUrl.startsWith('/uploads/') || book.pdfUrl.startsWith('http')) ? book.pdfUrl : undefined);

  const pages = book.content && book.content.length > 0
    ? book.content
    : [
        `Sinopse e introdução de "${book.title}":\n\n${book.description || 'Obra literária publicada pela Caseiro Editora.'}`,
        'Este livro encontra-se disponível no formato digital oficial. Utilize o botão "Ver PDF" no topo para visualizar o documento paginado original caso tenha sido carregado.',
      ];

  const totalPages = pages.length;
  const effectiveMaxPage = isSampleMode ? Math.min(totalPages - 1, Math.max(0, maxSamplePages - 1)) : totalPages - 1;

  const [currentPage, setCurrentPage] = useState(
    Math.min(Math.max(0, initialPage), effectiveMaxPage)
  );
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ pageIndex: number; text: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSampleGate, setShowSampleGate] = useState(false);

  const hasCustomExtractedContent = book.content && book.content.length > 0 && !book.content[0]?.startsWith('Capítulo 1: Introdução a ');
  const [showOriginalPdf, setShowOriginalPdf] = useState(!isSampleMode && hasRealPdf && !hasCustomExtractedContent);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, showSampleGate]);

  const handleNext = () => {
    if (isSampleMode && currentPage >= effectiveMaxPage) {
      setShowSampleGate(true);
      return;
    }
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (showSampleGate) {
      setShowSampleGate(false);
      return;
    }
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
      if (isSampleMode && index > effectiveMaxPage) return;
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

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col ${getThemeClass()} transition-colors duration-200`}>
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/10 dark:border-white/10 shadow-sm z-10 bg-black/5 dark:bg-white/5 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-brand-gold shrink-0" />
          <div className="max-w-[180px] sm:max-w-md truncate text-left">
            <h4 className="font-serif font-bold text-sm sm:text-base truncate leading-tight">
              {book.title} {isSampleMode ? '(Amostra Gratuita)' : ''}
            </h4>
            <p className="text-[11px] opacity-75">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Pesquisar no texto"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-black/10 dark:bg-white/10 p-0.5 rounded-lg border border-black/5">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md cursor-pointer ${theme === 'light' ? 'bg-white text-gray-900 shadow-xs' : 'opacity-70'}`}
              title="Modo Claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-md cursor-pointer ${theme === 'sepia' ? 'bg-[#dfd4ab] text-[#4a3b1a] shadow-xs' : 'opacity-70'}`}
              title="Modo Sépia"
            >
              <Landmark className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md cursor-pointer ${theme === 'dark' ? 'bg-brand-dark text-white shadow-xs' : 'opacity-70'}`}
              title="Modo Escuro"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-1">
            {(['sm', 'md', 'lg', 'xl'] as const).map((sz, idx) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`px-2 py-1 text-xs rounded-md border cursor-pointer ${
                  fontSize === sz ? 'bg-black/10 border-black/20 dark:bg-white/10 font-bold' : 'border-transparent'
                }`}
              >
                {idx === 0 ? 'A-' : idx === 1 ? 'A' : idx === 2 ? 'A+' : 'A++'}
              </button>
            ))}
          </div>

          {!isSampleMode && pdfSource && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setShowOriginalPdf(!showOriginalPdf)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  showOriginalPdf
                    ? 'bg-brand-gold text-brand-dark shadow-xs'
                    : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 text-current'
                }`}
                title={showOriginalPdf ? 'Voltar ao modo leitor de texto' : 'Visualizar ficheiro PDF original'}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showOriginalPdf ? 'Modo Texto' : 'Ver PDF'}</span>
              </button>
              <a
                href={pdfSource}
                download={book.pdfName || `${book.title}.pdf`}
                target={pdfSource.startsWith('/uploads/') || pdfSource.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="p-1.5 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 text-current transition-colors cursor-pointer"
                title="Descarregar ficheiro PDF"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-brand-gold hover:bg-brand-gold-light text-brand-dark shadow-sm transition-transform active:scale-95 cursor-pointer"
            title="Fechar Livro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Reader Stage */}
      <div className="flex-grow flex relative overflow-hidden">
        {searchOpen && (
          <div className="absolute top-0 right-0 h-full w-80 max-w-full bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 z-30 shadow-2xl border-l border-brand-gray/30 dark:border-brand-medium/20 flex flex-col p-4 animate-fade-in text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-gray/20 dark:border-brand-medium/10">
              <h5 className="font-bold text-sm">Pesquisar no Livro</h5>
              <button type="button" onClick={() => setSearchOpen(false)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
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
              <button type="submit" className="px-3 py-1.5 bg-brand-gold text-brand-dark rounded-lg text-xs font-bold cursor-pointer">
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
                      type="button"
                      onClick={() => {
                        setCurrentPage(res.pageIndex);
                        setShowSampleGate(false);
                        setSearchOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-brand-light dark:bg-brand-dark/20 text-xs border border-transparent hover:border-brand-gold transition-all cursor-pointer"
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

        {showOriginalPdf && pdfSource && !isSampleMode ? (
          <div className="flex-grow flex flex-col h-full bg-gray-100 dark:bg-gray-900 relative">
            <iframe
              src={pdfSource}
              title={book.title}
              className="w-full h-full border-0"
            />
          </div>
        ) : showSampleGate ? (
          <div className="flex-grow flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl bg-brand-dark text-white border border-brand-gold/40 p-8 text-center space-y-5 shadow-2xl animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">Fim da Amostra Gratuita</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Já leu as páginas de pré-visualização de <strong>{book.title}</strong>. Assine por apenas <strong>€3,99/mês</strong> ou <strong>€29,99/ano</strong> para desbloquear toda a obra e o catálogo completo.
              </p>
              <div className="flex flex-col gap-2.5 pt-2">
                {onSubscribe && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onSubscribe();
                    }}
                    className="w-full py-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-sm flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-brand-dark" />
                    <span>Assinar e Continuar Leitura</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSampleGate(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-200 cursor-pointer"
                >
                  Voltar à Amostra
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage === 0}
              className="hidden md:flex items-center justify-center w-20 h-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-0 cursor-pointer"
              title="Página Anterior"
            >
              <ChevronLeft className="w-8 h-8 opacity-65" />
            </button>

            <div className="flex-grow flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-y-auto">
              <div className="max-w-2xl w-full mx-auto rounded-xl py-6 px-4 sm:px-10 leading-relaxed font-serif text-left select-text">
                <div className="flex items-center justify-between mb-8 pb-3 border-b border-black/10 dark:border-white/10 opacity-65 text-xs font-serif tracking-widest uppercase">
                  <span>{book.title}</span>
                  <span>Secção {currentPage + 1}</span>
                </div>

                <div className={`reader-page ${getFontClass()} leading-loose tracking-wide whitespace-pre-line`}>
                  {highlightText(pages[currentPage] || '', searchQuery)}
                </div>

                <div className="mt-12 pt-4 border-t border-black/10 dark:border-white/10 opacity-60 text-center text-xs">
                  {isSampleMode
                    ? `Amostra gratuita: página ${currentPage + 1} de ${effectiveMaxPage + 1} (${totalPages} total)`
                    : `${currentPage + 1} de ${totalPages}`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!isSampleMode && currentPage === totalPages - 1}
              className="hidden md:flex items-center justify-center w-20 h-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-0 cursor-pointer"
              title="Próxima Página"
            >
              <ChevronRight className="w-8 h-8 opacity-65" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Footer Navigation Bar */}
      {!showOriginalPdf && (
        <div className="border-t border-black/10 dark:border-white/10 py-3.5 px-4 sm:px-6 flex items-center justify-between bg-black/5 dark:bg-white/5 z-10 select-none">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage === 0 && !showSampleGate}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-semibold disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center space-x-3 text-xs w-2/5 sm:w-1/3">
            <input
              type="range"
              min="0"
              max={effectiveMaxPage}
              value={currentPage}
              onChange={(e) => {
                setShowSampleGate(false);
                setCurrentPage(parseInt(e.target.value, 10));
              }}
              className="flex-grow accent-brand-gold cursor-pointer"
            />
            <span className="font-mono text-xs opacity-75">
              {Math.round(((currentPage + 1) / (isSampleMode ? effectiveMaxPage + 1 : totalPages)) * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!isSampleMode && currentPage === totalPages - 1}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-semibold disabled:opacity-30 cursor-pointer"
          >
            <span>{isSampleMode && currentPage >= effectiveMaxPage ? 'Desbloquear' : 'Seguinte'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
