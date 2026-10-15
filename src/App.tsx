import { useState, useEffect, useRef, MouseEvent } from 'react';
import { translations } from './data/translations';
import { initialBooks } from './data/initialBooks';
import { Book, UserProfile, AppLanguage } from './types';
import { loadBooksFromIndexedDB, saveBooksToIndexedDB, cleanBookForLocalStorage } from './utils/dbStorage';
import Header from './components/Header';
import Hero from './components/Hero';
import BookCard from './components/BookCard';
import BookDetailModal from './components/BookDetailModal';
import ReaderModal from './components/ReaderModal';
import SubscriptionModal from './components/SubscriptionModal';
import UserArea from './components/UserArea';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import InfoModals from './components/InfoModals';
import { Search, Globe, Library, Sparkles, Star, BookMarked, Layers, Bell, CheckCircle, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';

export default function App() {
  // Localization & Themes
  const [currentLang, setCurrentLang] = useState<AppLanguage>('pt');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Core Lists
  const isInitialLoadDoneRef = useRef(false);
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const deletedIds = new Set<string>(JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]'));
      const saved = localStorage.getItem('caseiro_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((b: Book) => !deletedIds.has(b.id));
        }
      }
      return initialBooks.filter((b) => !deletedIds.has(b.id));
    } catch {
      return initialBooks;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('caseiro_categories');
      return saved ? JSON.parse(saved) : ['Mistério', 'Ficção Científica', 'Desenvolvimento Pessoal', 'Romance', 'História', 'Negócios'];
    } catch {
      return ['Mistério', 'Ficção Científica', 'Desenvolvimento Pessoal', 'Romance', 'História', 'Negócios'];
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('caseiro_users');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback below
    }
    // Initial seeded user profile lists
    return [
      {
        email: 'smaccaseiro@gmail.com',
        name: 'Afonso Caseiro',
        isAdmin: true,
        isSubscribed: true,
        subscriptionPlan: 'annual',
        subscriptionRenewal: '2027-07-16',
        favorites: ['1', '3', '7'],
        readingHistory: [
          { bookId: '1', lastRead: '2026-07-16', progress: 50, currentPage: 1 },
          { bookId: '7', lastRead: '2026-07-15', progress: 25, currentPage: 0 }
        ],
        downloads: ['1', '7']
      },
      {
        email: 'leitor@exemplo.com',
        name: 'Ana Santos',
        isAdmin: false,
        isSubscribed: false,
        favorites: ['4'],
        readingHistory: [],
        downloads: []
      }
    ];
  });

  // Active user session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('caseiro_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // UI Tabs & Nav state with persistence across background tab switching/reloads
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return localStorage.getItem('caseiro_active_tab') || 'home';
    } catch {
      return 'home';
    }
  });

  const [isAdminMode, setAdminMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caseiro_is_admin_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Active book detail and reader state with persistent ID references
  const [activeBookDetailId, setActiveBookDetailId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('caseiro_active_detail_id');
    } catch {
      return null;
    }
  });

  const [activeBookReaderId, setActiveBookReaderId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('caseiro_active_reader_id');
    } catch {
      return null;
    }
  });

  const activeBookDetail = books.find((b) => b.id === activeBookDetailId) || null;
  const activeBookReader = books.find((b) => b.id === activeBookReaderId) || null;

  const setActiveBookDetail = (book: Book | null) => {
    setActiveBookDetailId(book ? book.id : null);
  };

  const setActiveBookReader = (book: Book | null) => {
    setActiveBookReaderId(book ? book.id : null);
  };

  const [isSubscriptionOpen, setSubscriptionOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<'privacy' | 'terms' | null>(null);

  // System Toast Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'alert' } | null>(null);

  // Auto save state & active views to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem('caseiro_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('caseiro_is_admin_mode', String(isAdminMode));
    } catch {
      // ignore
    }
  }, [isAdminMode]);

  useEffect(() => {
    try {
      if (activeBookDetailId) {
        localStorage.setItem('caseiro_active_detail_id', activeBookDetailId);
      } else {
        localStorage.removeItem('caseiro_active_detail_id');
      }
    } catch {
      // ignore
    }
  }, [activeBookDetailId]);

  useEffect(() => {
    try {
      if (activeBookReaderId) {
        localStorage.setItem('caseiro_active_reader_id', activeBookReaderId);
      } else {
        localStorage.removeItem('caseiro_active_reader_id');
      }
    } catch {
      // ignore
    }
  }, [activeBookReaderId]);

  // Load books from server first, fallback to IndexedDB
  useEffect(() => {
    let isMounted = true;
    fetch('/api/books')
      .then((res) => {
        if (!res.ok) throw new Error('API indisponível');
        return res.json();
      })
      .then((serverBooks) => {
        if (isMounted && Array.isArray(serverBooks)) {
          const deletedIds = new Set<string>(JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]'));
          const activeBooks = serverBooks.filter((b: Book) => !deletedIds.has(b.id));
          setBooks(activeBooks);
          saveBooksToIndexedDB(activeBooks);
          isInitialLoadDoneRef.current = true;
        }
      })
      .catch(() => {
        loadBooksFromIndexedDB().then((idbBooks) => {
          if (isMounted) {
            const deletedIds = new Set<string>(JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]'));
            if (idbBooks && Array.isArray(idbBooks)) {
              const activeBooks = idbBooks.filter((b: Book) => !deletedIds.has(b.id));
              setBooks(activeBooks);
            }
            isInitialLoadDoneRef.current = true;
          }
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Flush state immediately if page becomes hidden (e.g. backgrounding app on mobile)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        try {
          localStorage.setItem('caseiro_active_tab', activeTab);
          localStorage.setItem('caseiro_is_admin_mode', String(isAdminMode));
          const sanitized = books.map(cleanBookForLocalStorage);
          localStorage.setItem('caseiro_books', JSON.stringify(sanitized));
          
          const initialIds = new Set(initialBooks.map((b) => b.id));
          const customBooks = books.filter((b) => !initialIds.has(b.id)).map(cleanBookForLocalStorage);
          localStorage.setItem('caseiro_custom_books', JSON.stringify(customBooks));

          if (currentUser) {
            localStorage.setItem('caseiro_current_user', JSON.stringify(currentUser));
          }
        } catch {
          // ignore
        }
        saveBooksToIndexedDB(books);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [activeTab, isAdminMode, books, currentUser]);

  // Auto save to local storage and IndexedDB on changes
  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;

    saveBooksToIndexedDB(books);

    try {
      const sanitized = books.map(cleanBookForLocalStorage);
      localStorage.setItem('caseiro_books', JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Erro ao guardar catálogo no armazenamento local:', e);
    }

    try {
      const initialIds = new Set(initialBooks.map((b) => b.id));
      const customBooks = books.filter((b) => !initialIds.has(b.id)).map(cleanBookForLocalStorage);
      localStorage.setItem('caseiro_custom_books', JSON.stringify(customBooks));
    } catch (e) {
      console.warn('Erro ao guardar livros personalizados:', e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('caseiro_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Erro ao guardar categorias no armazenamento local:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('caseiro_users', JSON.stringify(users));
    } catch (e) {
      console.error('Erro ao guardar utilizadores no armazenamento local:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('caseiro_current_user', JSON.stringify(currentUser));
        // Update in main users roster too
        setUsers((prev) => prev.map((u) => u.email === currentUser.email ? currentUser : u));
      } else {
        localStorage.removeItem('caseiro_current_user');
      }
    } catch (e) {
      console.error('Erro ao guardar sessão de utilizador:', e);
    }
  }, [currentUser]);

  // Synchronize CSS Class for Light / Dark Mode theme triggers
  useEffect(() => {
    const root = window.document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#04100a'; // dark green background fallback
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f4f6f4'; // warm white light mode
    }
  }, [theme]);

  // Handle Stripe payment success/cancel query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const plan = params.get('plan') as 'monthly' | 'annual' | null;

    if (payment === 'success' && plan) {
      // Find logged in user (either in state or localStorage)
      const savedUserStr = localStorage.getItem('caseiro_current_user');
      const activeUser = currentUser || (savedUserStr ? JSON.parse(savedUserStr) : null);

      if (activeUser) {
        const renewalDate = new Date();
        if (plan === 'annual') {
          renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        } else {
          renewalDate.setMonth(renewalDate.getMonth() + 1);
        }

        const updatedUser = {
          ...activeUser,
          isSubscribed: true,
          subscriptionPlan: plan,
          subscriptionRenewal: renewalDate.toISOString().split('T')[0]
        };

        // Update local storage and component state
        localStorage.setItem('caseiro_current_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        // Update in main user roster
        setUsers((prev) => {
          const updated = prev.map((u) => u.email === updatedUser.email ? updatedUser : u);
          localStorage.setItem('caseiro_users', JSON.stringify(updated));
          return updated;
        });

        // Show a glorious success message
        showToast(
          plan === 'annual' 
            ? 'Subscrição Realizada com Sucesso! Bem-vindo ao Plano Anual Premium.' 
            : 'Subscrição Realizada com Sucesso! Bem-vindo ao Plano Mensal Premium.', 
          'success'
        );
      } else {
        showToast('Subscrição detetada, mas precisa de iniciar sessão para aceder às vantagens.', 'info');
      }

      // Clean up URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'cancel') {
      showToast('O pagamento foi cancelado. Pode tentar novamente quando desejar.', 'info');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message: string, type: 'success' | 'info' | 'alert' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Translation helpers
  const t = translations[currentLang];

  // Auth Callbacks
  const handleLoginSuccess = (email: string, name: string) => {
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      setCurrentUser(existingUser);
      if (existingUser.isAdmin) {
        setAdminMode(true);
        setActiveTab('admin');
      }
      showToast(`Bem-vindo de volta, ${existingUser.name}!`);
    } else {
      // Create profile automatically
      const isAdmin = email.toLowerCase() === 'smaccaseiro@gmail.com';
      const newUser: UserProfile = {
        email,
        name,
        isAdmin, // Admin role trigger
        isSubscribed: isAdmin,
        favorites: [],
        readingHistory: [],
        downloads: []
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      if (isAdmin) {
        setAdminMode(true);
        setActiveTab('admin');
      }
      showToast(`Conta criada com sucesso! Bem-vindo, ${name}!`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAdminMode(false);
    setActiveTab('home');
    showToast('Sessão terminada com sucesso.', 'info');
  };

  // Favorites logic
  const handleToggleFavorite = (e: MouseEvent | null, bookId: string) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    const isFav = currentUser.favorites.includes(bookId);
    let updatedFavs = [];

    if (isFav) {
      updatedFavs = currentUser.favorites.filter((id) => id !== bookId);
      showToast('Removido dos favoritos', 'info');
    } else {
      updatedFavs = [...currentUser.favorites, bookId];
      showToast('Adicionado aos favoritos!', 'success');
    }

    setCurrentUser({
      ...currentUser,
      favorites: updatedFavs
    });
  };

  // Trigger subscriptions payment
  const handleSubscribeSuccess = (plan: 'monthly' | 'annual') => {
    if (!currentUser) {
      // Require registration first
      setAuthOpen(true);
      return;
    }

    // Set active subscription
    const renewalDate = new Date();
    if (plan === 'annual') {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    }

    setCurrentUser({
      ...currentUser,
      isSubscribed: true,
      subscriptionPlan: plan,
      subscriptionRenewal: renewalDate.toISOString().split('T')[0]
    });

    showToast(t.paymentSuccess, 'success');
  };

  const handleCancelSubscription = () => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      isSubscribed: false,
      subscriptionPlan: undefined,
      subscriptionRenewal: undefined
    });
    showToast('Assinatura cancelada com sucesso. Lamentamos vê-lo partir!', 'alert');
  };

  // Downloads trigger & real file delivery
  const handleDownloadBook = (book: Book, format: 'pdf' | 'epub' = 'pdf') => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    const isEpub = format === 'epub';
    const fileData = isEpub 
      ? (book.epubData || (book.epubUrl?.startsWith('data:') ? book.epubUrl : ''))
      : (book.pdfData || (book.pdfUrl?.startsWith('data:') ? book.pdfUrl : ''));
    const fileUrl = isEpub ? book.epubUrl : book.pdfUrl;
    const fileName = isEpub
      ? (book.epubName || (book.epubUrl && !book.epubUrl.startsWith('data:') ? book.epubUrl.split('/').pop() : '') || `${book.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.epub`)
      : (book.pdfName || (book.pdfUrl && !book.pdfUrl.startsWith('data:') ? book.pdfUrl.split('/').pop() : '') || `${book.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`);

    // Trigger actual browser download
    try {
      if (fileData && fileData.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = fileData;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (fileUrl && (fileUrl.startsWith('/uploads/') || fileUrl.startsWith('http') || fileUrl.startsWith('/api/'))) {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Generate formatted digital book text
        const fullText = `CASEIRO EDITORA - EDICAO DIGITAL (${format.toUpperCase()})
========================================
Título: ${book.title}
Autor: ${book.author}
Categoria: ${book.category}
Ano de Publicação: ${book.publishedYear}
Idioma: ${book.language.toUpperCase()}
Páginas: ${book.pages}

SINOPSE:
${book.description}

========================================
CONTEÚDO DO LIVRO:
========================================

${(book.content || []).map((chap, i) => `--- Capítulo ${i + 1} ---\n\n${chap}`).join('\n\n')}

----------------------------------------
Obrigado por utilizar a Caseiro Editora Library.
`;
        const blob = new Blob([fullText], { type: isEpub ? 'application/epub+zip' : 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Erro no descarregamento do ficheiro:', e);
    }

    if (!currentUser.downloads.includes(book.id)) {
      setCurrentUser({
        ...currentUser,
        downloads: [...currentUser.downloads, book.id]
      });
      showToast(`Ficheiro (${format.toUpperCase()}) de "${book.title}" guardado com sucesso!`, 'success');
    } else {
      showToast(`Ficheiro (${format.toUpperCase()}) de "${book.title}" descarregado com sucesso.`, 'info');
    }
  };

  // Reader save callbacks (remembers where we were)
  const handleCloseReader = (currentPage: number, progress: number) => {
    if (!currentUser || !activeBookReader) {
      setActiveBookReader(null);
      return;
    }

    const historyIndex = currentUser.readingHistory.findIndex((h) => h.bookId === activeBookReader.id);
    let updatedHistory = [...currentUser.readingHistory];

    if (historyIndex >= 0) {
      updatedHistory[historyIndex] = {
        bookId: activeBookReader.id,
        lastRead: new Date().toISOString().split('T')[0],
        progress,
        currentPage
      };
    } else {
      updatedHistory.push({
        bookId: activeBookReader.id,
        lastRead: new Date().toISOString().split('T')[0],
        progress,
        currentPage
      });
    }

    setCurrentUser({
      ...currentUser,
      readingHistory: updatedHistory
    });

    showToast(`Progresso guardado: página ${currentPage + 1} (${progress}%)`, 'success');
    setActiveBookReader(null);
  };

  // Admin CRUD overrides with server sync
  const handleAddBook = async (newBook: Book) => {
    try {
      const deletedArr: string[] = JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]');
      const filteredDeleted = deletedArr.filter((did) => did !== newBook.id);
      localStorage.setItem('caseiro_deleted_book_ids', JSON.stringify(filteredDeleted));
    } catch {
      // ignore
    }

    const updated = [newBook, ...books.filter((b) => b.id !== newBook.id)];
    setBooks(updated);
    showToast('A guardar e-book e a processar ficheiros...', 'info');

    // Save to IndexedDB immediately
    saveBooksToIndexedDB(updated);

    // Send to server for persistent storage and disk saving
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      if (res.ok) {
        const savedBook = await res.json();
        setBooks((prev) => prev.map((b) => b.id === newBook.id ? savedBook : b));
        showToast('Novo e-book e ficheiros guardados permanentemente!', 'success');
      } else {
        showToast('Guardado no dispositivo (modo offline).', 'success');
      }
    } catch {
      showToast('Guardado no dispositivo (modo offline).', 'success');
    }
  };

  const handleEditBook = async (editedBook: Book) => {
    setBooks((prev) => prev.map((b) => b.id === editedBook.id ? editedBook : b));
    showToast('A atualizar e-book e ficheiros...', 'info');

    // Save to IndexedDB
    saveBooksToIndexedDB(books.map((b) => b.id === editedBook.id ? editedBook : b));

    // Send to server
    try {
      const res = await fetch(`/api/books/${editedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedBook),
      });
      if (res.ok) {
        const savedBook = await res.json();
        setBooks((prev) => prev.map((b) => b.id === editedBook.id ? savedBook : b));
        showToast('E-book e ficheiros atualizados com sucesso!', 'success');
      } else {
        showToast('Alterações guardadas no dispositivo.', 'success');
      }
    } catch {
      showToast('Alterações guardadas no dispositivo.', 'success');
    }
  };

  const handleRemoveBook = async (id: string) => {
    // 1. Mark as permanently deleted in local blacklist
    try {
      const deletedArr: string[] = JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]');
      if (!deletedArr.includes(id)) {
        deletedArr.push(id);
        localStorage.setItem('caseiro_deleted_book_ids', JSON.stringify(deletedArr));
      }
    } catch {
      // ignore
    }

    const remainingBooks = books.filter((b) => b.id !== id);
    setBooks(remainingBooks);
    showToast('E-book removido com sucesso.', 'alert');
    saveBooksToIndexedDB(remainingBooks);

    try {
      const sanitized = remainingBooks.map(cleanBookForLocalStorage);
      localStorage.setItem('caseiro_books', JSON.stringify(sanitized));
      const initialIds = new Set(initialBooks.map((b) => b.id));
      const customBooks = remainingBooks.filter((b) => !initialIds.has(b.id)).map(cleanBookForLocalStorage);
      localStorage.setItem('caseiro_custom_books', JSON.stringify(customBooks));
    } catch {
      // ignore
    }

    try {
      await fetch(`/api/books/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  const handleSetFeatured = (id: string) => {
    setBooks((prev) => prev.map((b) => ({ ...b, isFeatured: b.id === id })));
    showToast('Destaque global atualizado com sucesso.');
  };

  const handleAddCategory = (cat: string) => {
    setCategories((prev) => [...prev, cat]);
    showToast(`Categoria "${cat}" criada com sucesso.`);
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
    showToast(`Categoria "${cat}" removida.`, 'alert');
  };

  // Filter books list
  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'All' || book.language === selectedLanguage;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const featuredBook = books.find((b) => b.isFeatured) || books[0];

  // Recommendations tailored for active user based on favorite categories in reading list
  const userFavoriteCategories = currentUser 
    ? Array.from(new Set(currentUser.favorites.map((fId) => books.find((b) => b.id === fId)?.category).filter(Boolean)))
    : [];

  const recommendedBooks = books.filter((b) => {
    if (currentUser?.favorites.includes(b.id)) return false; // exclude already favorited
    if (userFavoriteCategories.length > 0) {
      return userFavoriteCategories.includes(b.category);
    }
    return b.language === currentLang; // default to current lang recommendations
  }).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-300">
      
      {/* HEADER BAR */}
      <Header
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        t={t}
        theme={theme}
        toggleTheme={toggleTheme}
        user={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminMode={isAdminMode}
        setAdminMode={setAdminMode}
      />

      {/* SYSTEM CORNER TOAST NOTIFICATIONS */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 border border-brand-gray/40 dark:border-brand-medium/30 flex items-center space-x-3 max-w-sm animate-fade-in">
          <div className={`p-2 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-500/15 text-green-500' 
              : notification.type === 'alert' 
              ? 'bg-red-500/15 text-red-500' 
              : 'bg-brand-gold/15 text-brand-gold'
          }`}>
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-relaxed">{notification.message}</p>
          </div>
        </div>
      )}

      {/* CORE PAGES ROUTER */}
      <main className="flex-grow">
        
        {/* HOMEPAGE VIEW */}
        {activeTab === 'home' && !isAdminMode && (
          <div className="space-y-16">
            {/* Immersive Hero Banner */}
            <Hero
              featuredBook={featuredBook}
              t={t}
              isSubscribed={currentUser?.isSubscribed || false}
              onReadBook={(b) => {
                const hist = currentUser?.readingHistory.find((h) => h.bookId === b.id);
                setActiveBookReader(b);
              }}
              onSubscribe={() => setSubscriptionOpen(true)}
              onExplore={() => {
                setActiveTab('library');
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
            />

            {/* Quick Continue Reading section if they have active history */}
            {currentUser && currentUser.readingHistory.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                <div className="flex items-center space-x-2.5 mb-6">
                  <span className="w-2 h-6 bg-brand-gold rounded-full block" />
                  <h3 className="font-serif text-2xl font-bold">{t.continueReading}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentUser.readingHistory.slice(0, 4).map((hist) => {
                    const matchedBook = books.find((b) => b.id === hist.bookId);
                    if (!matchedBook) return null;

                    return (
                      <div 
                        key={hist.bookId}
                        onClick={() => setActiveBookReader(matchedBook)}
                        className="p-4 rounded-xl border border-brand-gray/30 dark:border-brand-medium/15 bg-white dark:bg-brand-charcoal hover:bg-brand-gold/5 hover:border-brand-gold/45 transition-all shadow-sm flex items-center space-x-3.5 cursor-pointer group"
                      >
                        <img 
                          src={matchedBook.coverUrl} 
                          alt={matchedBook.title} 
                          className="w-10 h-14 object-cover rounded shadow-md shrink-0" 
                        />
                        <div className="min-w-0 flex-grow">
                          <h4 className="font-serif font-bold text-xs truncate text-brand-dark dark:text-white group-hover:text-brand-gold">{matchedBook.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Progresso: {hist.progress}%</p>
                          <div className="w-full bg-gray-200 dark:bg-brand-dark/50 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div className="bg-brand-gold h-1 rounded-full" style={{ width: `${hist.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations / personalized section */}
            {currentUser && recommendedBooks.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                <div className="flex items-center space-x-2.5 mb-6">
                  <span className="w-2 h-6 bg-brand-gold rounded-full block" />
                  <h3 className="font-serif text-2xl font-bold">{t.recommendations}</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {recommendedBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      t={t}
                      isSubscribed={currentUser.isSubscribed}
                      isFavorite={currentUser.favorites.includes(book.id)}
                      onToggleFavorite={(e) => handleToggleFavorite(e, book.id)}
                      onSelect={setActiveBookDetail}
                      onSubscribe={() => setSubscriptionOpen(true)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Showcase Categories Selection */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2 h-6 bg-brand-gold rounded-full block" />
                  <h3 className="font-serif text-2xl font-bold">Navegar por Categorias</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('library')}
                  className="text-xs font-bold text-brand-medium dark:text-brand-gold hover:underline"
                >
                  Ver toda a biblioteca
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((cat, index) => {
                  const count = books.filter((b) => b.category === cat).length;
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveTab('library');
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="p-5 rounded-2xl border border-brand-gray/30 dark:border-brand-medium/15 bg-white dark:bg-brand-charcoal text-center cursor-pointer hover:border-brand-gold hover:bg-brand-gold/5 transition-all shadow-xs"
                    >
                      <span className="text-xl block mb-2">📚</span>
                      <h4 className="font-semibold text-xs text-brand-dark dark:text-white">{cat}</h4>
                      <span className="text-[10px] text-gray-400 mt-1 block">{count} obras</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Beautiful visual subscription teaser banner */}
            {!currentUser?.isSubscribed && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-3xl bg-brand-dark overflow-hidden p-8 sm:p-12 text-center text-white border border-brand-gold/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-medium/60 to-brand-dark opacity-80" />
                  <div className="relative max-w-2xl mx-auto space-y-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-xs font-bold uppercase tracking-wider">Assine Hoje</span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold">Leitura Ilimitada em Qualquer Dispositivo</h2>
                    <p className="text-sm text-gray-300">Descubra milhares de páginas de mistério, negócios, ficção científica e romances em 6 idiomas. Cancele quando quiser.</p>
                    <button
                      onClick={() => setSubscriptionOpen(true)}
                      className="px-8 py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-extrabold rounded-xl shadow-lg hover:shadow-brand-gold/30 transition-all text-sm"
                    >
                      Desbloquear Biblioteca por €6,99/mês
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIBRARY CATALOG VIEW */}
        {activeTab === 'library' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-8 animate-fade-in">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight">Biblioteca Digital</h2>
              <p className="text-xs text-gray-400 mt-1">Explore as nossas obras e filtre por idioma ou categorias.</p>
            </div>

            {/* Filter controls row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-gray/30 dark:border-brand-medium/10 shadow-xs">
              
              {/* Search text filter */}
              <div className="md:col-span-6 relative">
                <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-brand-gray/55 dark:border-brand-medium/25 bg-transparent focus:ring-1 focus:ring-brand-gold focus:outline-none text-sm"
                />
              </div>

              {/* Category filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-gray/55 dark:border-brand-medium/25 bg-white dark:bg-brand-charcoal focus:ring-1 focus:ring-brand-gold focus:outline-none text-sm font-semibold"
                >
                  <option value="All">{t.allCategories}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Language filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-gray/55 dark:border-brand-medium/25 bg-white dark:bg-brand-charcoal focus:ring-1 focus:ring-brand-gold focus:outline-none text-sm font-semibold"
                >
                  <option value="All">{t.allLanguages}</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="it">🇮🇹 Italiano</option>
                </select>
              </div>
            </div>

            {/* Grid display of filtered e-books */}
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    t={t}
                    isSubscribed={currentUser?.isSubscribed || false}
                    isFavorite={currentUser?.favorites.includes(book.id) || false}
                    onToggleFavorite={(e) => handleToggleFavorite(e, book.id)}
                    onSelect={setActiveBookDetail}
                    onSubscribe={() => setSubscriptionOpen(true)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-brand-charcoal rounded-2xl border border-dashed border-gray-300">
                <p className="text-sm text-gray-400">Nenhum livro encontrado para os filtros selecionados.</p>
              </div>
            )}
          </div>
        )}

        {/* PRICING PLANS VIEW */}
        {activeTab === 'plans' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">Planos Simples e Transparentes</h2>
              <p className="text-xs text-gray-400">Assine e aceda de forma imediata à totalidade dos e-books. Sem taxas ocultas nem custos extra.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
              {/* Monthly plan */}
              <div className="rounded-2xl p-8 bg-white dark:bg-brand-charcoal border-2 border-brand-gray/30 dark:border-brand-medium/10 flex flex-col justify-between shadow-md">
                <div>
                  <span className="text-xs font-bold uppercase text-brand-medium dark:text-brand-gold tracking-widest">Plano Essencial</span>
                  <h3 className="font-serif text-2xl font-bold mt-2">{t.monthly}</h3>
                  <div className="mt-4 flex items-baseline text-brand-dark dark:text-white">
                    <span className="text-4xl font-extrabold tracking-tight">€6,99</span>
                    <span className="ml-1 text-sm text-gray-400">/mês</span>
                  </div>
                  <ul className="mt-8 space-y-3.5 text-xs text-gray-500 dark:text-gray-300">
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Catálogo completo de livros em 6 idiomas</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Leitor digital integrado no browser</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Sincronização imediata de progresso</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    if (!currentUser) setAuthOpen(true);
                    else setSubscriptionOpen(true);
                  }}
                  className="mt-10 w-full py-3 rounded-xl bg-brand-medium hover:bg-brand-dark text-white font-bold text-sm text-center shadow-xs"
                >
                  {t.subscribeNow}
                </button>
              </div>

              {/* Annual plan (High values highlighted) */}
              <div className="relative rounded-2xl p-8 bg-white dark:bg-brand-charcoal border-2 border-brand-gold flex flex-col justify-between shadow-xl">
                {/* Visual badge */}
                <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-brand-gold text-brand-dark text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                  {t.bestValue}
                </div>

                <div>
                  <span className="text-xs font-bold uppercase text-brand-gold tracking-widest">Acesso Anual Premium</span>
                  <h3 className="font-serif text-2xl font-bold mt-2 text-brand-gold">{t.annual}</h3>
                  <div className="mt-4 flex items-baseline text-brand-dark dark:text-white">
                    <span className="text-4xl font-extrabold tracking-tight">€59,99</span>
                    <span className="ml-1 text-sm text-gray-400">/ano</span>
                  </div>
                  <ul className="mt-8 space-y-3.5 text-xs text-gray-500 dark:text-gray-300">
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Todos os recursos do plano Mensal</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span className="font-semibold text-brand-medium dark:text-brand-gold">Economia de mais de €23 anuais</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Apoio prioritário ao leitor 24h</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    if (!currentUser) setAuthOpen(true);
                    else setSubscriptionOpen(true);
                  }}
                  className="mt-10 w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-extrabold text-sm text-center shadow-md transform hover:-translate-y-0.5 transition-all"
                >
                  {t.subscribeNow}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USER CONFIG PROFILE TAB AREA */}
        {activeTab === 'user' && currentUser && (
          <UserArea
            user={currentUser}
            t={t}
            allBooks={books}
            onCancelSubscription={handleCancelSubscription}
            onUpdatePassword={(pwd) => {
              setCurrentUser({ ...currentUser });
              showToast('Palavra-passe alterada de forma segura.');
            }}
            onSelectBook={setActiveBookDetail}
            onReadBook={setActiveBookReader}
          />
        )}

        {/* SECURE ADMIN PANEL DASHBOARD AREA */}
        {activeTab === 'admin' && currentUser?.isAdmin && isAdminMode && (
          <AdminPanel
            t={t}
            books={books}
            users={users}
            categories={categories}
            languages={['pt', 'en', 'de', 'es', 'fr', 'it']}
            onAddBook={handleAddBook}
            onEditBook={handleEditBook}
            onRemoveBook={handleRemoveBook}
            onSetFeatured={handleSetFeatured}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
          />
        )}

      </main>

      {/* FOOTER AREA */}
      <Footer
        t={t}
        onOpenPrivacy={() => setActiveInfoModal('privacy')}
        onOpenTerms={() => setActiveInfoModal('terms')}
      />

      {/* DYNAMIC COMPONENT DIALOG OVERLAYS */}
      
      {/* Book details overlay */}
      {activeBookDetail && (
        <BookDetailModal
          book={activeBookDetail}
          t={t}
          isSubscribed={currentUser?.isSubscribed || false}
          isFavorite={currentUser?.favorites.includes(activeBookDetail.id) || false}
          allBooks={books}
          onClose={() => setActiveBookDetail(null)}
          onToggleFavorite={(id) => handleToggleFavorite(null, id)}
          onRead={(b) => setActiveBookReader(b)}
          onSubscribe={() => setSubscriptionOpen(true)}
          onDownload={handleDownloadBook}
        />
      )}

      {/* Online Book pagination reader */}
      {activeBookReader && (
        <ReaderModal
          book={activeBookReader}
          initialPage={currentUser?.readingHistory.find((h) => h.bookId === activeBookReader.id)?.currentPage || 0}
          onClose={handleCloseReader}
        />
      )}

      {/* Credit card & payment simulation gateway */}
      {isSubscriptionOpen && (
        <SubscriptionModal
          t={t}
          onClose={() => setSubscriptionOpen(false)}
          onSubscribeSuccess={handleSubscribeSuccess}
          customerEmail={currentUser?.email || undefined}
        />
      )}

      {/* Sign in / Register oauth forms */}
      {isAuthOpen && (
        <AuthModal
          t={t}
          onClose={() => setAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Privacy and terms prose */}
      {activeInfoModal && (
        <InfoModals
          type={activeInfoModal}
          onClose={() => setActiveInfoModal(null)}
        />
      )}

    </div>
  );
}
