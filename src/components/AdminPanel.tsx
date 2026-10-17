import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { Book, UserProfile, TranslationSet } from '../types';
import { Plus, Edit, Trash2, CheckCircle, BarChart3, Users, BookOpen, Star, RefreshCw, Upload, Sparkles, FolderPlus, Globe, X, FileText, Download, Check, AlertCircle, Loader2 } from 'lucide-react';

interface AdminPanelProps {
  t: TranslationSet;
  books: Book[];
  users: UserProfile[];
  categories: string[];
  languages: string[];
  onAddBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onRemoveBook: (id: string) => void;
  onClearAllBooks?: () => void;
  onSetFeatured: (id: string) => void;
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

const getInitialDraft = () => {
  try {
    const saved = localStorage.getItem('caseiro_admin_form_draft');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export default function AdminPanel({
  t,
  books,
  users,
  categories,
  languages,
  onAddBook,
  onEditBook,
  onRemoveBook,
  onClearAllBooks,
  onSetFeatured,
  onAddCategory,
  onRemoveCategory,
}: AdminPanelProps) {
  const initialDraft = getInitialDraft();

  const [activeTab, setActiveTab] = useState<'stats' | 'books' | 'users' | 'taxonomy'>(() => {
    try {
      const saved = localStorage.getItem('caseiro_admin_panel_tab');
      if (saved && ['stats', 'books', 'users', 'taxonomy'].includes(saved)) {
        return saved as 'stats' | 'books' | 'users' | 'taxonomy';
      }
    } catch {
      // ignore
    }
    return 'stats';
  });
  
  // Book Form state with local storage draft recovery
  const [editingBook, setEditingBook] = useState<Book | null>(initialDraft?.editingBook ?? null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(initialDraft?.isFormOpen ?? false);
  const [formTitle, setFormTitle] = useState(initialDraft?.formTitle ?? '');
  const [formAuthor, setFormAuthor] = useState(initialDraft?.formAuthor ?? '');
  const [formCategory, setFormCategory] = useState(initialDraft?.formCategory ?? (categories[0] || 'Romance'));
  const [formLanguage, setFormLanguage] = useState(initialDraft?.formLanguage ?? 'pt');
  const [formPages, setFormPages] = useState<number>(initialDraft?.formPages ?? 250);
  const [formYear, setFormYear] = useState<number>(initialDraft?.formYear ?? 2024);
  const [formDescription, setFormDescription] = useState(initialDraft?.formDescription ?? '');
  const [formCoverUrl, setFormCoverUrl] = useState(initialDraft?.formCoverUrl ?? '');
  const [formPdfName, setFormPdfName] = useState(initialDraft?.formPdfName ?? '');
  const [formEpubName, setFormEpubName] = useState(initialDraft?.formEpubName ?? '');
  const [formPdfData, setFormPdfData] = useState(initialDraft?.formPdfData ?? '');
  const [formEpubData, setFormEpubData] = useState(initialDraft?.formEpubData ?? '');
  const [formCustomContent, setFormCustomContent] = useState<string[] | null>(initialDraft?.formCustomContent ?? null);

  // Persist admin active sub-tab
  useEffect(() => {
    try {
      localStorage.setItem('caseiro_admin_panel_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  // Persist form draft so switching apps to copy/paste text never loses progress
  useEffect(() => {
    try {
      if (isFormOpen) {
        localStorage.setItem(
          'caseiro_admin_form_draft',
          JSON.stringify({
            isFormOpen: true,
            editingBook,
            formTitle,
            formAuthor,
            formCategory,
            formLanguage,
            formPages,
            formYear,
            formDescription,
            formCoverUrl,
            formPdfName,
            formEpubName,
          })
        );
      } else {
        localStorage.removeItem('caseiro_admin_form_draft');
      }
    } catch (e) {
      console.error('Erro ao guardar rascunho:', e);
    }
  }, [
    isFormOpen,
    editingBook,
    formTitle,
    formAuthor,
    formCategory,
    formLanguage,
    formPages,
    formYear,
    formDescription,
    formCoverUrl,
    formPdfName,
    formEpubName,
  ]);

  // Handle visibility changes when mobile browser sends tab to background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && isFormOpen) {
        try {
          localStorage.setItem(
            'caseiro_admin_form_draft',
            JSON.stringify({
              isFormOpen: true,
              editingBook,
              formTitle,
              formAuthor,
              formCategory,
              formLanguage,
              formPages,
              formYear,
              formDescription,
              formCoverUrl,
              formPdfName,
              formEpubName,
            })
          );
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [
    isFormOpen,
    editingBook,
    formTitle,
    formAuthor,
    formCategory,
    formLanguage,
    formPages,
    formYear,
    formDescription,
    formCoverUrl,
    formPdfName,
    formEpubName,
  ]);

  // File Upload Refs and State
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const epubInputRef = useRef<HTMLInputElement>(null);

  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [isReadingEpub, setIsReadingEpub] = useState(false);
  const [isReadingCover, setIsReadingCover] = useState(false);
  const [pdfFileSize, setPdfFileSize] = useState<string>('');
  const [epubFileSize, setEpubFileSize] = useState<string>('');

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCoverFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsReadingCover(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (!rawResult) {
          setIsReadingCover(false);
          return;
        }

        // Compress image using HTML Canvas to keep size optimal
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            setFormCoverUrl(compressedDataUrl);
          } else {
            setFormCoverUrl(rawResult);
          }
          setIsReadingCover(false);
        };
        img.onerror = () => {
          setFormCoverUrl(rawResult);
          setIsReadingCover(false);
        };
        img.src = rawResult;
      };
      reader.onerror = () => {
        setIsReadingCover(false);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePdfFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormPdfName(file.name);
      setPdfFileSize(formatBytes(file.size));
      setIsReadingPdf(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormPdfData(result);
        }
        setIsReadingPdf(false);
      };
      reader.onerror = () => {
        setIsReadingPdf(false);
      };
      reader.readAsDataURL(file);

      // If readable text file (.txt, .md, .json), extract pages for reader
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const textReader = new FileReader();
        textReader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            const paragraphs = text.split(/\n\s*\n/);
            const pages: string[] = [];
            let current = '';
            for (const p of paragraphs) {
              if ((current + p).length > 1200 && current) {
                pages.push(current.trim());
                current = p;
              } else {
                current += '\n\n' + p;
              }
            }
            if (current.trim()) pages.push(current.trim());
            if (pages.length > 0) setFormCustomContent(pages);
          }
        };
        textReader.readAsText(file);
      }
    }
    e.target.value = '';
  };

  const handleEpubFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormEpubName(file.name);
      setEpubFileSize(formatBytes(file.size));
      setIsReadingEpub(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormEpubData(result);
        }
        setIsReadingEpub(false);
      };
      reader.onerror = () => {
        setIsReadingEpub(false);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Category addition form state
  const [newCatName, setNewCatName] = useState('');
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleClearAllBooks = () => {
    if (onClearAllBooks) {
      onClearAllBooks();
    } else {
      books.forEach((b) => onRemoveBook(b.id));
    }
    setConfirmClearAll(false);
  };

  // Stats calculation
  const totalSubscribers = users.filter((u) => u.isSubscribed).length;
  const monthlyRevenue = users.filter((u) => u.isSubscribed && u.subscriptionPlan === 'monthly').length * 3.99;
  const annualRevenue = users.filter((u) => u.isSubscribed && u.subscriptionPlan === 'annual').length * 29.99;
  const estimatedTotalAnnualRevenue = monthlyRevenue * 12 + annualRevenue;

  const handleOpenNewBook = () => {
    try {
      localStorage.removeItem('caseiro_admin_form_draft');
    } catch {
      // ignore
    }
    setEditingBook(null);
    setFormTitle('');
    setFormAuthor('');
    setFormCategory(categories[0] || 'Romance');
    setFormLanguage('pt');
    setFormPages(250);
    setFormYear(new Date().getFullYear());
    setFormDescription('');
    setFormCoverUrl('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400');
    setFormPdfName('');
    setFormEpubName('');
    setFormPdfData('');
    setFormEpubData('');
    setPdfFileSize('');
    setEpubFileSize('');
    setIsReadingPdf(false);
    setIsReadingEpub(false);
    setIsReadingCover(false);
    setFormCustomContent(null);
    setIsFormOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    try {
      localStorage.removeItem('caseiro_admin_form_draft');
    } catch {
      // ignore
    }
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormCategory(book.category);
    setFormLanguage(book.language);
    setFormPages(book.pages);
    setFormYear(book.publishedYear);
    setFormDescription(book.description);
    setFormCoverUrl(book.coverUrl);
    setFormPdfName(book.pdfName || (book.pdfUrl && !book.pdfUrl.startsWith('data:') ? book.pdfUrl.split('/').pop() : '') || '');
    setFormEpubName(book.epubName || (book.epubUrl && !book.epubUrl.startsWith('data:') ? book.epubUrl.split('/').pop() : '') || '');
    setFormPdfData(book.pdfData || (book.pdfUrl?.startsWith('data:') ? book.pdfUrl : ''));
    setFormEpubData(book.epubData || (book.epubUrl?.startsWith('data:') ? book.epubUrl : ''));
    setPdfFileSize(book.pdfData || book.pdfUrl ? 'Ficheiro Anexado' : '');
    setEpubFileSize(book.epubData || book.epubUrl ? 'Ficheiro Anexado' : '');
    setIsReadingPdf(false);
    setIsReadingEpub(false);
    setIsReadingCover(false);
    setFormCustomContent(book.content || null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isReadingPdf || isReadingEpub || isReadingCover) {
      return;
    }

    const finalContent = formCustomContent && formCustomContent.length > 0
      ? formCustomContent
      : (editingBook?.content && editingBook.content.length > 0
          ? editingBook.content
          : [
              `Capítulo 1: Introdução a ${formTitle}. O início de uma jornada extraordinária escrita por ${formAuthor} neste magnífico livro.`,
              'Capítulo 2: Desenvolvimento de Personagens e Conflitos. Novas descobertas trazem grandes mistérios literários que prendem a atenção do leitor.',
              'Capítulo 3: O Clímax Decisivo. O momento onde tudo se decide nas páginas finais desta obra incrível.',
              'Capítulo 4: Conclusão Geral do Enredo. Um desfecho emocionante que ficará guardado na memória do leitor.'
            ]);

    const resolvedPdfData = formPdfData || editingBook?.pdfData;
    const resolvedEpubData = formEpubData || editingBook?.epubData;

    const bookData: Book = {
      id: editingBook ? editingBook.id : String(Date.now()),
      title: formTitle,
      author: formAuthor,
      category: formCategory,
      language: formLanguage,
      pages: Number(formPages),
      publishedYear: Number(formYear),
      description: formDescription,
      coverUrl: formCoverUrl,
      pdfUrl: formPdfName ? (editingBook?.pdfUrl || formPdfName) : (editingBook?.pdfUrl || 'documento_digital.pdf'),
      epubUrl: formEpubName ? (editingBook?.epubUrl || formEpubName) : (editingBook?.epubUrl || 'livro_digital.epub'),
      pdfName: formPdfName || editingBook?.pdfName || 'documento_digital.pdf',
      epubName: formEpubName || editingBook?.epubName || 'livro_digital.epub',
      pdfData: resolvedPdfData,
      epubData: resolvedEpubData,
      isFeatured: editingBook ? editingBook.isFeatured : false,
      content: finalContent,
    };

    if (editingBook) {
      onEditBook(bookData);
    } else {
      onAddBook(bookData);
    }

    // Clean up draft and close modal
    try {
      localStorage.removeItem('caseiro_admin_form_draft');
    } catch {
      // ignore
    }
    setEditingBook(null);
    setIsFormOpen(false);
  };

  const handleAddCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newCatName.trim() && !categories.includes(newCatName.trim())) {
      onAddCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-gray/20 dark:border-brand-medium/10 pb-6 mb-8 gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark dark:text-white">{t.adminPanel}</h2>
          <p className="text-xs text-gray-400 mt-1">Bem-vindo ao centro administrativo da Caseiro Editora.</p>
        </div>

        {/* Tab Selector Links */}
        <div className="flex items-center space-x-1.5 p-1 bg-brand-light dark:bg-brand-dark/30 rounded-xl border border-brand-gray/40 dark:border-brand-medium/10">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'stats' ? 'bg-brand-gold text-brand-dark shadow-xs' : 'text-gray-400 hover:text-brand-dark dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'books' ? 'bg-brand-gold text-brand-dark shadow-xs' : 'text-gray-400 hover:text-brand-dark dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Livros ({books.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users' ? 'bg-brand-gold text-brand-dark shadow-xs' : 'text-gray-400 hover:text-brand-dark dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilizadores ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'taxonomy' ? 'bg-brand-gold text-brand-dark shadow-xs' : 'text-gray-400 hover:text-brand-dark dark:hover:text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Categorias</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS SECTION */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-fade-in">
          {/* Stats bento grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-brand-charcoal border border-brand-gray/30 dark:border-brand-medium/10 shadow-md">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Assinantes Ativos</span>
                <Users className="w-5 h-5 text-brand-gold" />
              </div>
              <p className="text-3xl font-extrabold mt-3 text-brand-dark dark:text-white">{totalSubscribers}</p>
              <p className="text-xs text-green-500 font-bold mt-1.5">Taxa de Conversão: {Math.round((totalSubscribers / users.length) * 100)}%</p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-brand-charcoal border border-brand-gray/30 dark:border-brand-medium/10 shadow-md">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Faturação Mensal Est.</span>
                <span className="text-brand-gold text-lg font-bold">€</span>
              </div>
              <p className="text-3xl font-extrabold mt-3 text-brand-dark dark:text-white">€{monthlyRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1.5">Exclusivo assinaturas mensais</p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-brand-charcoal border border-brand-gray/30 dark:border-brand-medium/10 shadow-md">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Faturação Anual Est.</span>
                <span className="text-brand-gold text-lg font-bold">€</span>
              </div>
              <p className="text-3xl font-extrabold mt-3 text-brand-dark dark:text-white">€{annualRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1.5">Exclusivo assinaturas anuais</p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-brand-charcoal border border-brand-gray/30 dark:border-brand-medium/10 shadow-md">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Faturação Anualizada</span>
                <Sparkles className="w-5 h-5 text-brand-gold" />
              </div>
              <p className="text-3xl font-extrabold mt-3 text-brand-dark dark:text-white">€{estimatedTotalAnnualRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-500 font-bold mt-1.5">Previsão ARR de faturação</p>
            </div>
          </div>

          {/* Graphical/visual section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-brand-charcoal rounded-2xl p-6 border border-brand-gray/30 dark:border-brand-medium/10 shadow-md">
              <h4 className="font-serif font-bold text-base mb-4">Distribuição de Livros por Categoria</h4>
              <div className="space-y-3">
                {categories.map((cat) => {
                  const count = books.filter((b) => b.category === cat).length;
                  const percentage = books.length > 0 ? (count / books.length) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold">{cat}</span>
                        <span className="text-gray-400">{count} livros ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-brand-light dark:bg-brand-dark/30 rounded-full h-2 overflow-hidden border border-brand-gray/20">
                        <div className="bg-brand-medium dark:bg-brand-gold h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-brand-charcoal rounded-2xl p-6 border border-brand-gray/30 dark:border-brand-medium/10 shadow-md flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-base mb-1">Estatísticas Gerais do Catálogo</h4>
                <p className="text-xs text-gray-400">Métricas acumuladas de toda a plataforma.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-brand-light/45 dark:bg-brand-dark/20 text-center">
                  <span className="text-xs text-gray-400">Total de Páginas</span>
                  <p className="text-xl font-bold mt-1 text-brand-medium dark:text-brand-gold">
                    {books.reduce((acc, curr) => acc + curr.pages, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-brand-light/45 dark:bg-brand-dark/20 text-center">
                  <span className="text-xs text-gray-400">Idiomas Suportados</span>
                  <p className="text-xl font-bold mt-1 text-brand-medium dark:text-brand-gold">
                    {languages.length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-brand-light/45 dark:bg-brand-dark/20 text-center">
                  <span className="text-xs text-gray-400">Média de Páginas/Livro</span>
                  <p className="text-xl font-bold mt-1 text-brand-medium dark:text-brand-gold">
                    {books.length > 0 ? Math.round(books.reduce((acc, curr) => acc + curr.pages, 0) / books.length) : 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-brand-light/45 dark:bg-brand-dark/20 text-center">
                  <span className="text-xs text-gray-400">Favoritos Totais</span>
                  <p className="text-xl font-bold mt-1 text-brand-medium dark:text-brand-gold">
                    {users.reduce((acc, curr) => acc + curr.favorites.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKS MANAGEMENT SECTION (ADD, EDIT, REMOVE, DEFINE HIGHLIGHT) */}
      {activeTab === 'books' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <h4 className="font-serif font-bold text-lg">Catálogo de Livros</h4>
            <div className="flex items-center space-x-2">
              {books.length > 0 && (
                confirmClearAll ? (
                  <div className="flex items-center space-x-1.5 p-1 bg-red-500/10 border border-red-500/30 rounded-xl animate-fade-in">
                    <span className="text-xs font-bold text-red-500 px-2">Eliminar tudo?</span>
                    <button
                      type="button"
                      onClick={handleClearAllBooks}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      Sim, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(true)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold text-xs transition-all cursor-pointer"
                    title="Eliminar todos os livros de uma só vez"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Todos os Livros</span>
                  </button>
                )
              )}
              <button
                onClick={handleOpenNewBook}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-bold text-xs shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar E-Book</span>
              </button>
            </div>
          </div>

          {/* Form Overlay Modal for Add/Edit */}
          {isFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-6">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={() => setIsFormOpen(false)} />
              
              <form
                onSubmit={handleFormSubmit}
                className="relative bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 p-4 sm:p-6 rounded-2xl max-w-lg w-full shadow-2xl border border-brand-gray/30 dark:border-brand-medium/20 z-10 max-h-[85vh] flex flex-col transition-all overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-3 border-b border-brand-gray/20 dark:border-brand-medium/30 shrink-0">
                  <div>
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-brand-dark dark:text-brand-gold">
                      {editingBook ? 'Editar Livro' : 'Adicionar Novo Livro'}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Preencha as informações do e-book</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-brand-medium/40 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Scrollable Form Body */}
                <div className="overflow-y-auto py-3 space-y-4 pr-1 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Título do Livro</label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-semibold mb-1">Autor</label>
                      <input
                        type="text"
                        required
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-semibold mb-1">Categoria</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-sm bg-white dark:bg-brand-charcoal focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-semibold mb-1">Idioma</label>
                      <select
                        value={formLanguage}
                        onChange={(e) => setFormLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-sm bg-white dark:bg-brand-charcoal focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-semibold mb-1">Número de Páginas</label>
                      <input
                        type="number"
                        required
                        value={formPages}
                        onChange={(e) => setFormPages(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Ano de Publicação</label>
                      <input
                        type="number"
                        required
                        value={formYear}
                        onChange={(e) => setFormYear(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    {/* Hidden Native File Inputs */}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverFileSelect}
                    />
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handlePdfFileSelect}
                    />
                    <input
                      ref={epubInputRef}
                      type="file"
                      accept=".epub,application/epub+zip"
                      className="hidden"
                      onChange={handleEpubFileSelect}
                    />

                    <div className="col-span-1 sm:col-span-2 space-y-2">
                      <label className="block text-xs font-semibold">Capa do Livro</label>
                      
                      {/* Live Image Preview */}
                      {formCoverUrl && (
                        <div className="flex items-center space-x-3 p-2 border border-brand-gray/30 rounded-xl bg-gray-50 dark:bg-brand-medium/10">
                          <img
                            src={formCoverUrl}
                            alt="Pré-visualização da Capa"
                            className="w-12 h-16 object-cover rounded-md shadow-xs border border-gray-200 dark:border-gray-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400';
                            }}
                          />
                          <div className="text-xs space-y-0.5 overflow-hidden">
                            <span className="font-semibold text-brand-dark dark:text-gray-200 block">Pré-visualização da Capa</span>
                            <span className="text-gray-500 text-[10px] block truncate max-w-xs">
                              {formCoverUrl.startsWith('data:') ? 'Ficheiro local do dispositivo' : formCoverUrl}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-gray-500 block mb-1">Carregar dos Meus Ficheiros:</span>
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 border border-dashed border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20 active:scale-95 rounded-xl text-xs font-bold text-brand-dark dark:text-brand-gold cursor-pointer transition-all shadow-xs"
                          >
                            <Upload className="w-4 h-4 text-brand-gold shrink-0" />
                            <span className="truncate">Escolher Imagem/Foto</span>
                          </button>
                        </div>

                        <div>
                          <span className="text-[11px] text-gray-500 block mb-1">Ou colar URL da Imagem:</span>
                          <input
                            type="text"
                            placeholder="https://exemplo.com/capa.jpg"
                            value={formCoverUrl.startsWith('data:') ? '' : formCoverUrl}
                            onChange={(e) => setFormCoverUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-xs bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Sinopse / Descrição</label>
                      <textarea
                        required
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                      />
                    </div>

                    {/* Local PDF/EPUB Upload Controls */}
                    <div className="col-span-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Ficheiro PDF Digital</span>
                        </label>
                        {isReadingPdf && (
                          <span className="text-[11px] text-brand-gold flex items-center space-x-1 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>A processar...</span>
                          </span>
                        )}
                      </div>

                      {/* PDF Uploaded Status Card */}
                      {formPdfData || formPdfName ? (
                        <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 dark:bg-green-500/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <div className="p-1.5 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 shrink-0">
                                <Check className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-brand-dark dark:text-white truncate">
                                  {formPdfName || 'Ficheiro PDF'}
                                </p>
                                <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                                  {pdfFileSize ? `Pronto para guardar (${pdfFileSize})` : 'Ficheiro pronto para guardar'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormPdfData('');
                                setFormPdfName('');
                                setPdfFileSize('');
                              }}
                              className="text-[11px] text-red-500 hover:text-red-700 font-semibold px-2 py-1 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remover ficheiro PDF"
                            >
                              Remover
                            </button>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => pdfInputRef.current?.click()}
                              className="flex-1 py-1.5 px-2 bg-white dark:bg-brand-charcoal hover:bg-gray-100 border border-brand-gray/30 rounded-lg text-[11px] font-semibold text-center transition-colors cursor-pointer"
                            >
                              Substituir PDF
                            </button>
                            {formPdfData && (
                              <button
                                type="button"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = formPdfData;
                                  a.download = formPdfName || 'documento.pdf';
                                  a.click();
                                }}
                                className="py-1.5 px-2.5 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-dark dark:text-brand-gold rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Testar download do ficheiro"
                              >
                                Testar Download
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => pdfInputRef.current?.click()}
                            disabled={isReadingPdf}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-3 border border-dashed border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20 active:scale-95 rounded-xl text-xs font-bold text-brand-dark dark:text-brand-gold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4 text-brand-gold shrink-0" />
                            <span>Carregar PDF do Dispositivo</span>
                          </button>
                          <input
                            type="text"
                            placeholder="Ou cole URL direto do PDF..."
                            value={formPdfName}
                            onChange={(e) => setFormPdfName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-xs bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
                          <span>Ficheiro EPUB Digital</span>
                        </label>
                        {isReadingEpub && (
                          <span className="text-[11px] text-brand-gold flex items-center space-x-1 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>A processar...</span>
                          </span>
                        )}
                      </div>

                      {/* EPUB Uploaded Status Card */}
                      {formEpubData || formEpubName ? (
                        <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 dark:bg-green-500/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <div className="p-1.5 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 shrink-0">
                                <Check className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-brand-dark dark:text-white truncate">
                                  {formEpubName || 'Ficheiro EPUB'}
                                </p>
                                <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                                  {epubFileSize ? `Pronto para guardar (${epubFileSize})` : 'Ficheiro pronto para guardar'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormEpubData('');
                                setFormEpubName('');
                                setEpubFileSize('');
                              }}
                              className="text-[11px] text-red-500 hover:text-red-700 font-semibold px-2 py-1 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Remover ficheiro EPUB"
                            >
                              Remover
                            </button>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => epubInputRef.current?.click()}
                              className="flex-1 py-1.5 px-2 bg-white dark:bg-brand-charcoal hover:bg-gray-100 border border-brand-gray/30 rounded-lg text-[11px] font-semibold text-center transition-colors cursor-pointer"
                            >
                              Substituir EPUB
                            </button>
                            {formEpubData && (
                              <button
                                type="button"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = formEpubData;
                                  a.download = formEpubName || 'documento.epub';
                                  a.click();
                                }}
                                className="py-1.5 px-2.5 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-dark dark:text-brand-gold rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Testar download do ficheiro"
                              >
                                Testar Download
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => epubInputRef.current?.click()}
                            disabled={isReadingEpub}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-3 border border-dashed border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20 active:scale-95 rounded-xl text-xs font-bold text-brand-dark dark:text-brand-gold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4 text-brand-gold shrink-0" />
                            <span>Carregar EPUB do Dispositivo</span>
                          </button>
                          <input
                            type="text"
                            placeholder="Ou cole URL direto do EPUB..."
                            value={formEpubName}
                            onChange={(e) => setFormEpubName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-brand-gray/55 dark:border-brand-medium/25 rounded-xl text-xs bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end items-center space-x-2 pt-3 mt-2 border-t border-brand-gray/20 dark:border-brand-medium/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 border border-gray-300 dark:border-brand-medium/40 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-brand-medium/30 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isReadingPdf || isReadingEpub || isReadingCover}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-brand-gold text-brand-dark rounded-xl text-xs font-bold hover:bg-brand-gold-light shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isReadingPdf || isReadingEpub || isReadingCover ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>A processar ficheiros...</span>
                      </>
                    ) : (
                      <span>{t.save}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table display of all Books */}
          <div className="overflow-x-auto rounded-xl border border-brand-gray/30 dark:border-brand-medium/15 shadow-sm">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs uppercase bg-brand-light dark:bg-brand-dark text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-4">Livro</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Idioma</th>
                  <th className="px-6 py-4">Destaque</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray/20 dark:divide-brand-medium/10">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-light/50 dark:hover:bg-brand-dark/20 text-brand-charcoal dark:text-gray-200">
                    <td className="px-6 py-4 font-medium flex items-center space-x-3.5">
                      <img src={b.coverUrl} alt={b.title} className="w-9 h-12 object-cover rounded shadow-md shrink-0" />
                      <div>
                        <p className="font-serif font-bold text-sm leading-tight">{b.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.author}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{b.category}</td>
                    <td className="px-6 py-4 uppercase font-mono text-xs">{b.language}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onSetFeatured(b.id)}
                        className={`p-1.5 rounded-full border transition-all ${
                          b.isFeatured 
                            ? 'bg-brand-gold/25 border-brand-gold text-brand-gold' 
                            : 'border-brand-gray/40 text-gray-300 hover:text-brand-gold hover:bg-brand-gold/10'
                        }`}
                        title="Definir como Destaque Global"
                      >
                        <Star className={`w-4 h-4 ${b.isFeatured ? 'fill-brand-gold' : ''}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditBook(b)}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookToDelete(b)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:scale-105 transition-all cursor-pointer"
                          title="Eliminar permanentemente este livro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS & ACTIVE MEMBERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <h4 className="font-serif font-bold text-lg">Registo de Utilizadores e Assinantes</h4>
          
          <div className="overflow-x-auto rounded-xl border border-brand-gray/30 dark:border-brand-medium/15 shadow-sm">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs uppercase bg-brand-light dark:bg-brand-dark text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-4">Utilizador</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado Assinatura</th>
                  <th className="px-6 py-4">Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray/20 dark:divide-brand-medium/10">
                {users.map((u, index) => (
                  <tr key={index} className="hover:bg-brand-light/50 dark:hover:bg-brand-dark/20 text-brand-charcoal dark:text-gray-200">
                    <td className="px-6 py-4 font-semibold">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.isAdmin ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold/15 text-brand-gold border border-brand-gold/40">
                          Administrador
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-400/15 text-gray-400">
                          Membro Comum
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isSubscribed ? (
                        <span className="flex items-center space-x-1.5 text-green-500 font-bold text-xs">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Ativo</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium text-xs">Sem Assinatura</span>
                      )}
                    </td>
                    <td className="px-6 py-4 uppercase font-mono text-xs text-brand-gold-dark dark:text-brand-gold-light font-bold">
                      {u.isSubscribed ? (u.subscriptionPlan || 'monthly') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAXONOMY & CATEGORIES SETTINGS */}
      {activeTab === 'taxonomy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-white dark:bg-brand-charcoal p-6 rounded-2xl border border-brand-gray/30 dark:border-brand-medium/10 shadow-md">
            <h4 className="font-serif font-bold text-base mb-4 flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-brand-gold" />
              <span>Gestão de Categorias</span>
            </h4>

            <form onSubmit={handleAddCategorySubmit} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Ex: Fantasia, Finanças..."
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-grow px-3 py-2 border border-brand-gray/55 dark:border-brand-medium/25 rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-gold text-brand-dark rounded-lg text-xs font-bold hover:bg-brand-gold-light"
              >
                Adicionar
              </button>
            </form>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat} className="flex justify-between items-center p-3 rounded-lg bg-brand-light/45 dark:bg-brand-dark/20 text-sm">
                  <span className="font-semibold">{cat}</span>
                  <button
                    onClick={() => onRemoveCategory(cat)}
                    className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-brand-charcoal p-6 rounded-2xl border border-brand-gray/30 dark:border-brand-medium/10 shadow-md">
            <h4 className="font-serif font-bold text-base mb-4 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-brand-gold" />
              <span>Idiomas Suportados</span>
            </h4>
            
            <p className="text-xs text-gray-400 mb-6">Estes são os idiomas oficiais do catálogo, selecionáveis no cabeçalho.</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-brand-light/45 dark:bg-brand-dark/20">
                <span className="text-lg">🇵🇹</span>
                <span className="text-xs font-semibold">Português (pt)</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-brand-light/45 dark:bg-brand-dark/20">
                <span className="text-lg">🇬🇧</span>
                <span className="text-xs font-semibold">Inglês (en)</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-brand-light/45 dark:bg-brand-dark/20">
                <span className="text-lg">🇩🇪</span>
                <span className="text-xs font-semibold">Alemão (de)</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-brand-light/45 dark:bg-brand-dark/20">
                <span className="text-lg">🇪🇸</span>
                <span className="text-xs font-semibold">Espanhol (es)</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-brand-light/45 dark:bg-brand-dark/20">
                <span className="text-lg">🇫🇷</span>
                <span className="text-xs font-semibold">Francês (fr)</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-brand-light/45 dark:bg-brand-dark/20">
                <span className="text-lg">🇮🇹</span>
                <span className="text-xs font-semibold">Italiano (it)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Book Permanent Deletion Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-500/30 space-y-4">
            <div className="flex items-center space-x-3 text-red-500">
              <div className="p-3 rounded-full bg-red-500/15">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-serif text-lg font-bold">Eliminar Livro Permanentemente</h3>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-brand-light dark:bg-brand-dark/40 rounded-xl border border-brand-gray/30 dark:border-brand-medium/20">
              <img src={bookToDelete.coverUrl} alt={bookToDelete.title} className="w-12 h-16 object-cover rounded shadow-md shrink-0" />
              <div className="min-w-0">
                <p className="font-serif font-bold text-sm text-brand-dark dark:text-white truncate">{bookToDelete.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{bookToDelete.author}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-1">{bookToDelete.category} • {bookToDelete.pages} páginas</p>
              </div>
            </div>

            <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              ⚠️ Esta ação removerá o livro, a capa e todos os ficheiros (PDF e EPUB) da base de dados e do servidor de forma definitiva.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-brand-medium/40 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-medium/30 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveBook(bookToDelete.id);
                  setBookToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar Livro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Books Modal */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-500/30 space-y-4">
            <div className="flex items-center space-x-3 text-red-500">
              <div className="p-3 rounded-full bg-red-500/15">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-serif text-lg font-bold">Eliminar TODO o Catálogo?</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Tem a certeza de que deseja apagar todos os <strong>{books.length}</strong> livros do catálogo?
            </p>

            <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              ⚠️ Todos os e-books e ficheiros enviados serão removidos do servidor e do armazenamento local.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-brand-medium/40 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-medium/30 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAllBooks}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar Todos</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
