import { useState, useEffect, useRef, MouseEvent } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { translations } from './data/translations';
import { initialBooks } from './data/initialBooks';
import { Book, UserProfile, AppLanguage } from './types';
import { loadBooksFromIndexedDB, saveBooksToIndexedDB, cleanBookForLocalStorage } from './utils/dbStorage';
import {
  auth,
  ADMIN_EMAIL,
  fetchBooksFromFirestore,
  syncBookToFirestore,
  deleteBookFromFirestore,
  fetchCategoriesFromFirestore,
  syncCategoryToFirestore,
  deleteCategoryFromFirestore,
  ensureAdminDocInFirestore,
  fetchUserProfileFromFirestore,
  createOrUpdateUserProfileInFirestore,
  updateUserReadingStateInFirestore,
  updateUserSubscriptionInFirestore,
  fetchAllUsersForAdmin,
} from './firebase';
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
import { OfflineIndicator } from './components/OfflineIndicator';
import { Search, Bell, CheckCircle } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Mistério',
  'Ficção Científica',
  'Desenvolvimento Pessoal',
  'Romance',
  'História',
  'Negócios',
];

export default function App() {
  const [currentLang, setCurrentLang] = useState<AppLanguage>('pt');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const DUMMY_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);
  const isInitialLoadDoneRef = useRef(false);

  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const deletedIds = new Set<string>([
        ...JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]'),
        ...Array.from(DUMMY_IDS),
      ]);
      const saved = localStorage.getItem('caseiro_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((b: Book) => !deletedIds.has(b.id) && !DUMMY_IDS.has(b.id));
          if (valid.length > 0) return valid;
        }
      }
      return initialBooks.filter((b) => !deletedIds.has(b.id) && !DUMMY_IDS.has(b.id));
    } catch {
      return initialBooks.filter((b) => !DUMMY_IDS.has(b.id));
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('caseiro_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('caseiro_active_tab');
      if (saved && ['home', 'library', 'plans', 'user', 'admin'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'home';
  });

  const [isAdminMode, setAdminMode] = useState<boolean>(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Book Detail & Reader state
  const [activeBookDetailId, setActiveBookDetailId] = useState<string | null>(null);
  const [activeBookReaderId, setActiveBookReaderId] = useState<string | null>(null);
  const [readerSampleMode, setReaderSampleMode] = useState<boolean>(false);

  const activeBookDetail = books.find((b) => b.id === activeBookDetailId) || null;
  const activeBookReader = books.find((b) => b.id === activeBookReaderId) || null;

  const setActiveBookDetail = (book: Book | null) => {
    setActiveBookDetailId(book ? book.id : null);
  };

  const openBookReader = (book: Book, sampleMode?: boolean) => {
    const isMember = Boolean(currentUser?.isSubscribed);
    setReaderSampleMode(sampleMode ?? !isMember);
    setActiveBookReaderId(book.id);
  };

  const [isSubscriptionOpen, setSubscriptionOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<'privacy' | 'terms' | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'alert' } | null>(null);

  const pendingVerifiedStripeRef = useRef<{
    plan: 'monthly' | 'annual';
    sessionId: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'alert' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Persist active tab
  useEffect(() => {
    try {
      localStorage.setItem('caseiro_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  // Synchronize CSS Class for Light / Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      body.style.backgroundColor = '#04100a';
      body.style.color = '#f9fafb';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      body.style.backgroundColor = '#f4f6f4';
      body.style.color = '#1c2420';
    }
  }, [theme]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || !fbUser.email) {
        setCurrentUser(null);
        setAdminMode(false);
        setUsers([]);
        setIsAuthReady(true);
        return;
      }

      const email = fbUser.email.toLowerCase();
      const isAdmin = email === ADMIN_EMAIL && fbUser.emailVerified;

      try {
        if (isAdmin) {
          await ensureAdminDocInFirestore(fbUser.uid, email);
        }

        let profile = await fetchUserProfileFromFirestore(fbUser.uid);
        if (!profile) {
          profile = {
            uid: fbUser.uid,
            email,
            name: fbUser.displayName || email.split('@')[0] || 'Leitor',
            isAdmin,
            isSubscribed: isAdmin,
            subscriptionPlan: isAdmin ? 'annual' : undefined,
            favorites: [],
            readingHistory: [],
            downloads: [],
          };
          await createOrUpdateUserProfileInFirestore(fbUser.uid, profile, true);
        } else if (isAdmin && !profile.isAdmin) {
          profile = { ...profile, isAdmin: true, isSubscribed: true };
          await createOrUpdateUserProfileInFirestore(fbUser.uid, profile, false);
        }

        // Apply pending verified Stripe payment if user returned from Checkout
        if (pendingVerifiedStripeRef.current) {
          const pending = pendingVerifiedStripeRef.current;
          pendingVerifiedStripeRef.current = null;
          const renewalDate = new Date();
          if (pending.plan === 'annual') renewalDate.setFullYear(renewalDate.getFullYear() + 1);
          else renewalDate.setMonth(renewalDate.getMonth() + 1);
          const renewalStr = renewalDate.toISOString().split('T')[0];

          profile = {
            ...profile,
            isSubscribed: true,
            subscriptionPlan: pending.plan,
            subscriptionRenewal: renewalStr,
            stripeSessionId: pending.sessionId,
          };
          await updateUserSubscriptionInFirestore(fbUser.uid, {
            isSubscribed: true,
            subscriptionPlan: pending.plan,
            subscriptionRenewal: renewalStr,
            stripeSessionId: pending.sessionId,
          });
          showToast(
            pending.plan === 'annual'
              ? 'Subscrição Anual verificada e ativada com sucesso!'
              : 'Subscrição Mensal verificada e ativada com sucesso!',
            'success'
          );
        }

        setCurrentUser(profile);

        if (profile.isAdmin) {
          try {
            const allUsers = await fetchAllUsersForAdmin();
            setUsers(allUsers);
          } catch {
            setUsers([profile]);
          }
        } else {
          setUsers([profile]);
        }
      } catch (err) {
        console.error('Erro ao carregar perfil Firebase:', err);
        setCurrentUser({
          uid: fbUser.uid,
          email,
          name: fbUser.displayName || email.split('@')[0],
          isAdmin,
          isSubscribed: isAdmin,
          favorites: [],
          readingHistory: [],
          downloads: [],
        });
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load books & categories from Firestore + Server API + IndexedDB fallback
  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      const deletedIds = new Set<string>([
        ...(() => {
          try {
            return JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]');
          } catch {
            return [];
          }
        })(),
        ...Array.from(DUMMY_IDS),
      ]);

      const [serverResult, firestoreResult, fsCats] = await Promise.allSettled([
        fetch('/api/books').then((r) => (r.ok ? r.json() : null)),
        fetchBooksFromFirestore(),
        fetchCategoriesFromFirestore(),
      ]);

      if (!isMounted) return;

      const serverBooks: Book[] =
        serverResult.status === 'fulfilled' && Array.isArray(serverResult.value)
          ? serverResult.value
          : [];
      const fsBooks: Book[] =
        firestoreResult.status === 'fulfilled' && Array.isArray(firestoreResult.value)
          ? firestoreResult.value
          : [];

      // Merge cloud Firestore + server API (prefer Firestore cloud metadata if available, enriched with server file URLs)
      const mergedMap = new Map<string, Book>();
      serverBooks.forEach((b) => {
        if (!deletedIds.has(b.id) && !DUMMY_IDS.has(b.id)) {
          mergedMap.set(b.id, b);
        }
      });
      fsBooks.forEach((b) => {
        if (!deletedIds.has(b.id) && !DUMMY_IDS.has(b.id)) {
          const existing = mergedMap.get(b.id);
          mergedMap.set(b.id, existing ? { ...existing, ...b } : b);
        }
      });

      const merged = Array.from(mergedMap.values());

      if (merged.length > 0) {
        setBooks(merged);
        saveBooksToIndexedDB(merged);
        try {
          localStorage.setItem('caseiro_books', JSON.stringify(merged.map(cleanBookForLocalStorage)));
        } catch {
          // ignore
        }
      } else if (serverResult.status === 'rejected' && firestoreResult.status === 'rejected') {
        const idbBooks = await loadBooksFromIndexedDB();
        if (isMounted && Array.isArray(idbBooks)) {
          const activeBooks = idbBooks.filter((b: Book) => !deletedIds.has(b.id) && !DUMMY_IDS.has(b.id));
          setBooks(activeBooks);
        }
      }

      if (fsCats.status === 'fulfilled' && Array.isArray(fsCats.value) && fsCats.value.length > 0) {
        setCategories(fsCats.value);
      }

      isInitialLoadDoneRef.current = true;
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep IndexedDB / localStorage updated after initial load
  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;
    saveBooksToIndexedDB(books);
    try {
      localStorage.setItem('caseiro_books', JSON.stringify(books.map(cleanBookForLocalStorage)));
    } catch {
      // ignore
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('caseiro_categories', JSON.stringify(categories));
    } catch {
      // ignore
    }
  }, [categories]);

  // Verify Stripe Checkout completion server-side via session_id
  useEffect(() => {
    if (!isAuthReady) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');

    if (payment === 'success' && sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname);

      fetch('/api/verify-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(async ({ ok, data }) => {
          if (!ok || !data.paid) {
            showToast(data.error || 'O pagamento ainda não foi confirmado pelo Stripe.', 'alert');
            return;
          }

          const verifiedPlan: 'monthly' | 'annual' = data.plan === 'annual' ? 'annual' : 'monthly';

          if (currentUser && currentUser.uid) {
            const renewalDate = new Date();
            if (verifiedPlan === 'annual') renewalDate.setFullYear(renewalDate.getFullYear() + 1);
            else renewalDate.setMonth(renewalDate.getMonth() + 1);
            const renewalStr = renewalDate.toISOString().split('T')[0];

            const updated: UserProfile = {
              ...currentUser,
              isSubscribed: true,
              subscriptionPlan: verifiedPlan,
              subscriptionRenewal: renewalStr,
              stripeSessionId: sessionId,
            };
            setCurrentUser(updated);
            try {
              await updateUserSubscriptionInFirestore(currentUser.uid, {
                isSubscribed: true,
                subscriptionPlan: verifiedPlan,
                subscriptionRenewal: renewalStr,
                stripeSessionId: sessionId,
              });
            } catch (err) {
              console.error('Erro ao gravar subscrição verificada:', err);
            }
            showToast(
              verifiedPlan === 'annual'
                ? 'Subscrição Anual verificada e ativada com sucesso!'
                : 'Subscrição Mensal verificada e ativada com sucesso!',
              'success'
            );
          } else {
            pendingVerifiedStripeRef.current = { plan: verifiedPlan, sessionId };
            showToast('Pagamento confirmado! Inicie sessão com Google para associar a subscrição à sua conta.', 'info');
            setAuthOpen(true);
          }
        })
        .catch(() => {
          showToast('Erro de rede ao validar a sessão Stripe.', 'alert');
        });
    } else if (payment === 'cancel') {
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast('O pagamento foi cancelado. Pode tentar novamente quando desejar.', 'info');
    }
  }, [isAuthReady, currentUser]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const t = translations[currentLang];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setAdminMode(false);
    setActiveTab('home');
    showToast('Sessão terminada com sucesso.', 'info');
  };

  // Persist Favorites / Reading History / Downloads to state + Firestore
  const persistReadingState = async (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    if (updatedUser.uid) {
      try {
        await updateUserReadingStateInFirestore(updatedUser.uid, {
          favorites: updatedUser.favorites,
          readingHistory: updatedUser.readingHistory,
          downloads: updatedUser.downloads,
        });
      } catch (err) {
        console.error('Erro ao sincronizar estado de leitura na nuvem:', err);
      }
    }
  };

  const handleToggleFavorite = (e: MouseEvent | null, bookId: string) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    const isFav = currentUser.favorites.includes(bookId);
    const updatedFavs = isFav
      ? currentUser.favorites.filter((id) => id !== bookId)
      : [...currentUser.favorites, bookId];

    showToast(isFav ? 'Removido dos favoritos' : 'Adicionado aos favoritos!', isFav ? 'info' : 'success');
    persistReadingState({ ...currentUser, favorites: updatedFavs });
  };

  const handleCancelSubscription = async () => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      isSubscribed: false,
      subscriptionPlan: undefined,
      subscriptionRenewal: undefined,
    };
    setCurrentUser(updated);
    if (currentUser.uid) {
      try {
        await updateUserSubscriptionInFirestore(currentUser.uid, {
          isSubscribed: false,
        });
      } catch (err) {
        console.error('Erro ao cancelar subscrição:', err);
      }
    }
    showToast('Assinatura cancelada com sucesso.', 'alert');
  };

  const handleDownloadBook = (book: Book, format: 'pdf' | 'epub' = 'pdf') => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }

    const isEpub = format === 'epub';
    const fileData = isEpub
      ? book.epubData || (book.epubUrl?.startsWith('data:') ? book.epubUrl : '')
      : book.pdfData || (book.pdfUrl?.startsWith('data:') ? book.pdfUrl : '');
    const fileUrl = isEpub ? book.epubUrl : book.pdfUrl;
    const fileName = isEpub
      ? book.epubName || `${book.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.epub`
      : book.pdfName || `${book.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;

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
        const fullText = `CASEIRO EDITORA - EDIÇÃO DIGITAL (${format.toUpperCase()})
========================================
Título: ${book.title}
Autor: ${book.author}
Categoria: ${book.category}
Ano de Publicação: ${book.publishedYear}
Idioma: ${book.language.toUpperCase()}

SINOPSE:
${book.description}

========================================
${(book.content || []).map((chap, i) => `--- Secção ${i + 1} ---\n\n${chap}`).join('\n\n')}
`;
        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace(/\.(pdf|epub)$/i, '.txt');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Erro no descarregamento:', e);
    }

    if (!currentUser.downloads.includes(book.id)) {
      persistReadingState({ ...currentUser, downloads: [...currentUser.downloads, book.id] });
      showToast(`Ficheiro de "${book.title}" guardado com sucesso!`, 'success');
    } else {
      showToast(`Ficheiro de "${book.title}" descarregado.`, 'info');
    }
  };

  const handleCloseReader = (currentPage: number, progress: number) => {
    if (!currentUser || !activeBookReader || readerSampleMode) {
      setActiveBookReaderId(null);
      return;
    }

    const historyIndex = currentUser.readingHistory.findIndex((h) => h.bookId === activeBookReader.id);
    const updatedHistory = [...currentUser.readingHistory];
    const entry = {
      bookId: activeBookReader.id,
      lastRead: new Date().toISOString().split('T')[0],
      progress,
      currentPage,
    };

    if (historyIndex >= 0) updatedHistory[historyIndex] = entry;
    else updatedHistory.push(entry);

    persistReadingState({ ...currentUser, readingHistory: updatedHistory });
    showToast(`Progresso guardado: página ${currentPage + 1} (${progress}%)`, 'success');
    setActiveBookReaderId(null);
  };

  // Admin CRUD with Server + Firestore Cloud Sync
  const handleAddBook = async (newBook: Book) => {
    try {
      const deletedArr: string[] = JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]');
      localStorage.setItem('caseiro_deleted_book_ids', JSON.stringify(deletedArr.filter((did) => did !== newBook.id)));
    } catch {
      // ignore
    }

    const updated = [newBook, ...books.filter((b) => b.id !== newBook.id)];
    setBooks(updated);
    saveBooksToIndexedDB(updated);
    showToast('A guardar e-book na nuvem e no servidor...', 'info');

    let finalBook = newBook;
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      if (res.ok) {
        finalBook = await res.json();
        setBooks((prev) => prev.map((b) => (b.id === newBook.id ? finalBook : b)));
      }
    } catch {
      // continue to cloud sync
    }

    try {
      await syncBookToFirestore(finalBook);
      showToast('Novo e-book guardado permanentemente na nuvem!', 'success');
    } catch {
      showToast('E-book guardado localmente.', 'info');
    }
  };

  const handleEditBook = async (editedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === editedBook.id ? editedBook : b)));
    showToast('A atualizar e-book...', 'info');

    let finalBook = editedBook;
    try {
      const res = await fetch(`/api/books/${editedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedBook),
      });
      if (res.ok) {
        finalBook = await res.json();
        setBooks((prev) => prev.map((b) => (b.id === editedBook.id ? finalBook : b)));
      }
    } catch {
      // continue
    }

    try {
      await syncBookToFirestore(finalBook);
      showToast('E-book atualizado na nuvem com sucesso!', 'success');
    } catch {
      showToast('Alterações guardadas.', 'info');
    }
  };

  const handleRemoveBook = async (id: string) => {
    try {
      const deletedArr: string[] = JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]');
      if (!deletedArr.includes(id)) {
        deletedArr.push(id);
        localStorage.setItem('caseiro_deleted_book_ids', JSON.stringify(deletedArr));
      }
    } catch {
      // ignore
    }

    setBooks((prev) => prev.filter((b) => b.id !== id));
    showToast('Livro removido permanentemente.', 'alert');

    await Promise.allSettled([
      fetch(`/api/books/${id}`, { method: 'DELETE' }),
      deleteBookFromFirestore(id),
    ]);
  };

  const handleClearAllBooks = async () => {
    const allIds = books.map((b) => b.id);
    setBooks([]);
    saveBooksToIndexedDB([]);
    showToast('Todos os livros foram removidos do catálogo.', 'alert');

    try {
      localStorage.setItem('caseiro_books', JSON.stringify([]));
      const deletedArr: string[] = JSON.parse(localStorage.getItem('caseiro_deleted_book_ids') || '[]');
      localStorage.setItem(
        'caseiro_deleted_book_ids',
        JSON.stringify(Array.from(new Set([...deletedArr, ...allIds, ...Array.from(DUMMY_IDS)])))
      );
    } catch {
      // ignore
    }

    await Promise.allSettled([
      fetch('/api/books/clear-all', { method: 'DELETE' }),
      ...allIds.map((id) => deleteBookFromFirestore(id)),
    ]);
  };

  const handleSetFeatured = async (id: string) => {
    const updatedBooks = books.map((b) => ({ ...b, isFeatured: b.id === id }));
    setBooks(updatedBooks);
    showToast('Destaque global atualizado com sucesso.');

    const target = updatedBooks.find((b) => b.id === id);
    if (target) {
      await Promise.allSettled(
        updatedBooks.map((b) => syncBookToFirestore(b))
      );
      await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target),
      }).catch(() => {});
    }
  };

  const handleAddCategory = async (cat: string) => {
    setCategories((prev) => [...prev, cat]);
    showToast(`Categoria "${cat}" criada com sucesso.`);
    try {
      await syncCategoryToFirestore(cat);
    } catch {
      // ignore
    }
  };

  const handleRemoveCategory = async (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
    showToast(`Categoria "${cat}" removida.`, 'alert');
    try {
      await deleteCategoryFromFirestore(cat);
    } catch {
      // ignore
    }
  };

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

  const userFavoriteCategories = currentUser
    ? Array.from(new Set(currentUser.favorites.map((fId) => books.find((b) => b.id === fId)?.category).filter(Boolean)))
    : [];

  const recommendedBooks = books
    .filter((b) => {
      if (currentUser?.favorites.includes(b.id)) return false;
      if (userFavoriteCategories.length > 0) return userFavoriteCategories.includes(b.category);
      return b.language === currentLang;
    })
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-300">
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

      <OfflineIndicator />

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-gray-100 border border-brand-gray/40 dark:border-brand-medium/30 flex items-center space-x-3 max-w-sm animate-fade-in">
          <div
            className={`p-2 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-500/15 text-green-500'
                : notification.type === 'alert'
                ? 'bg-red-500/15 text-red-500'
                : 'bg-brand-gold/15 text-brand-gold'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-relaxed">{notification.message}</p>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {activeTab === 'home' && !isAdminMode && (
          <div className="space-y-16">
            <Hero
              featuredBook={featuredBook}
              t={t}
              isSubscribed={currentUser?.isSubscribed || false}
              onReadBook={(b, sampleMode) => openBookReader(b, sampleMode)}
              onSubscribe={() => {
                if (!currentUser) setAuthOpen(true);
                else setSubscriptionOpen(true);
              }}
              onExplore={() => {
                setActiveTab('library');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

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
                        onClick={() => openBookReader(matchedBook, !currentUser.isSubscribed)}
                        className="p-4 rounded-xl border border-brand-gray/30 dark:border-brand-medium/15 bg-white dark:bg-brand-charcoal hover:bg-brand-gold/5 hover:border-brand-gold/45 transition-all shadow-sm flex items-center space-x-3.5 cursor-pointer group"
                      >
                        <img
                          src={matchedBook.coverUrl || '/default-cover.jpg'}
                          alt={matchedBook.title}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg'; }}
                          className="w-10 h-14 object-cover rounded shadow-md shrink-0"
                        />
                        <div className="min-w-0 flex-grow">
                          <h4 className="font-serif font-bold text-xs truncate text-brand-dark dark:text-white group-hover:text-brand-gold">
                            {matchedBook.title}
                          </h4>
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
                      onReadSample={(b) => openBookReader(b, true)}
                      onSubscribe={() => setSubscriptionOpen(true)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Catalog Preview on Home when not empty */}
            {books.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2 h-6 bg-brand-gold rounded-full block" />
                    <h3 className="font-serif text-2xl font-bold">Catálogo em Destaque</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('library');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-bold text-brand-medium dark:text-brand-gold hover:underline cursor-pointer"
                  >
                    Explorar Biblioteca →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {books.slice(0, 4).map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      t={t}
                      isSubscribed={currentUser?.isSubscribed || false}
                      isFavorite={currentUser?.favorites.includes(book.id) || false}
                      onToggleFavorite={(e) => handleToggleFavorite(e, book.id)}
                      onSelect={setActiveBookDetail}
                      onReadSample={(b) => openBookReader(b, true)}
                      onSubscribe={() => {
                        if (!currentUser) setAuthOpen(true);
                        else setSubscriptionOpen(true);
                      }}
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
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="text-xs font-bold text-brand-medium dark:text-brand-gold hover:underline cursor-pointer"
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
                        window.scrollTo({ top: 0, behavior: 'smooth' });
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

            {!currentUser?.isSubscribed && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-3xl bg-brand-dark overflow-hidden p-8 sm:p-12 text-center text-white border border-brand-gold/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-medium/60 to-brand-dark opacity-80" />
                  <div className="relative max-w-2xl mx-auto space-y-6">
                    <span className="text-brand-gold text-xs font-bold uppercase tracking-widest block">
                      Assinatura Premium
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                      Leitura Ilimitada em Qualquer Dispositivo
                    </h2>
                    <p className="text-sm text-gray-300">
                      Descubra todas as obras de mistério, ficção e ensaios em 6 idiomas. Instale como app e leia offline quando desejar.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) setAuthOpen(true);
                        else setSubscriptionOpen(true);
                      }}
                      className="px-8 py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-extrabold rounded-xl shadow-lg transition-all text-sm cursor-pointer"
                    >
                      Desbloquear Biblioteca por €3,99/mês
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left space-y-8 animate-fade-in">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight">Biblioteca Digital</h2>
              <p className="text-xs text-gray-400 mt-1">Explore as nossas obras, leia amostras gratuitas e filtre por idioma ou categoria.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-brand-charcoal p-4 rounded-2xl border border-brand-gray/30 dark:border-brand-medium/10 shadow-xs">
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
                    onReadSample={(b) => openBookReader(b, true)}
                    onSubscribe={() => {
                      if (!currentUser) setAuthOpen(true);
                      else setSubscriptionOpen(true);
                    }}
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

        {activeTab === 'plans' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">Planos Simples e Transparentes</h2>
              <p className="text-xs text-gray-400">
                Assine e aceda de forma imediata à totalidade dos e-books. Sem taxas ocultas nem fidelização.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
              <div className="rounded-2xl p-8 bg-white dark:bg-brand-charcoal border-2 border-brand-gray/30 dark:border-brand-medium/10 flex flex-col justify-between shadow-md">
                <div>
                  <span className="text-xs font-bold uppercase text-brand-medium dark:text-brand-gold tracking-widest">
                    Plano Essencial
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-2">{t.monthly}</h3>
                  <div className="mt-4 flex items-baseline text-brand-dark dark:text-white">
                    <span className="text-4xl font-extrabold tracking-tight">€3,99</span>
                    <span className="ml-1 text-sm text-gray-400">/mês</span>
                  </div>
                  <ul className="mt-8 space-y-3.5 text-xs text-gray-500 dark:text-gray-300">
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Catálogo completo de livros em 6 idiomas</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Leitor digital integrado + downloads PDF/EPUB</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Sincronização na nuvem entre dispositivos</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) setAuthOpen(true);
                    else setSubscriptionOpen(true);
                  }}
                  className="mt-10 w-full py-3 rounded-xl bg-brand-medium hover:bg-brand-dark text-white font-bold text-sm text-center shadow-xs cursor-pointer"
                >
                  {t.subscribeNow}
                </button>
              </div>

              <div className="relative rounded-2xl p-8 bg-white dark:bg-brand-charcoal border-2 border-brand-gold flex flex-col justify-between shadow-xl">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-brand-gold mb-2">
                  ★ {t.bestValue}
                </div>

                <div>
                  <span className="text-xs font-bold uppercase text-brand-gold tracking-widest">
                    Acesso Anual Premium
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-2 text-brand-gold">{t.annual}</h3>
                  <div className="mt-4 flex items-baseline text-brand-dark dark:text-white">
                    <span className="text-4xl font-extrabold tracking-tight">€29,99</span>
                    <span className="ml-1 text-sm text-gray-400">/ano</span>
                  </div>
                  <ul className="mt-8 space-y-3.5 text-xs text-gray-500 dark:text-gray-300">
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Todos os recursos do plano Mensal</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span className="font-semibold text-brand-medium dark:text-brand-gold">
                        Poupe mais de 37% em comparação com o mensal
                      </span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle className="w-4.5 h-4.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>Apoio prioritário ao leitor</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) setAuthOpen(true);
                    else setSubscriptionOpen(true);
                  }}
                  className="mt-10 w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-brand-dark font-extrabold text-sm text-center shadow-md transition-all cursor-pointer"
                >
                  {t.subscribeNow}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'user' && currentUser && (
          <UserArea
            user={currentUser}
            t={t}
            allBooks={books}
            onCancelSubscription={handleCancelSubscription}
            onSelectBook={setActiveBookDetail}
            onReadBook={(b) => openBookReader(b, !currentUser.isSubscribed)}
          />
        )}

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
            onClearAllBooks={handleClearAllBooks}
            onSetFeatured={handleSetFeatured}
            onAddCategory={handleAddCategory}
            onRemoveCategory={handleRemoveCategory}
          />
        )}
      </main>

      <Footer
        t={t}
        currentLang={currentLang}
        onOpenPrivacy={() => setActiveInfoModal('privacy')}
        onOpenTerms={() => setActiveInfoModal('terms')}
      />

      {activeBookDetail && (
        <BookDetailModal
          book={activeBookDetail}
          t={t}
          isSubscribed={currentUser?.isSubscribed || false}
          isFavorite={currentUser?.favorites.includes(activeBookDetail.id) || false}
          allBooks={books}
          onClose={() => setActiveBookDetail(null)}
          onSelectBook={(rec) => setActiveBookDetail(rec)}
          onToggleFavorite={(id) => handleToggleFavorite(null, id)}
          onRead={(b, sampleMode) => openBookReader(b, sampleMode)}
          onSubscribe={() => {
            if (!currentUser) setAuthOpen(true);
            else setSubscriptionOpen(true);
          }}
          onDownload={handleDownloadBook}
        />
      )}

      {activeBookReader && (
        <ReaderModal
          book={activeBookReader}
          initialPage={
            readerSampleMode
              ? 0
              : currentUser?.readingHistory.find((h) => h.bookId === activeBookReader.id)?.currentPage || 0
          }
          isSampleMode={readerSampleMode}
          maxSamplePages={2}
          onSubscribe={() => {
            if (!currentUser) setAuthOpen(true);
            else setSubscriptionOpen(true);
          }}
          onClose={handleCloseReader}
        />
      )}

      {isSubscriptionOpen && (
        <SubscriptionModal
          t={t}
          onClose={() => setSubscriptionOpen(false)}
          customerEmail={currentUser?.email || undefined}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          t={t}
          onClose={() => setAuthOpen(false)}
        />
      )}

      {activeInfoModal && (
        <InfoModals
          type={activeInfoModal}
          onClose={() => setActiveInfoModal(null)}
        />
      )}
    </div>
  );
}
