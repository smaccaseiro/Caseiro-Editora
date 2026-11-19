import { useState } from 'react';
import { BookOpen, Globe, Moon, Sun, User, Settings, LogOut, Menu, X, Star } from 'lucide-react';
import { AppLanguage, UserProfile, TranslationSet } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentLang: AppLanguage;
  onLangChange: (lang: AppLanguage) => void;
  t: TranslationSet;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminMode: boolean;
  setAdminMode: (mode: boolean) => void;
}

const languagesList = [
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

const navTranslations: Record<AppLanguage, { home: string; library: string; plans: string; faq: string; contact: string }> = {
  pt: { home: 'Início', library: 'Biblioteca', plans: 'Planos', faq: 'FAQ', contact: 'Contacto' },
  en: { home: 'Home', library: 'Library', plans: 'Plans', faq: 'FAQ', contact: 'Contact' },
  de: { home: 'Startseite', library: 'Bibliothek', plans: 'Pläne', faq: 'FAQ', contact: 'Kontakt' },
  es: { home: 'Inicio', library: 'Biblioteca', plans: 'Planes', faq: 'FAQ', contact: 'Contacto' },
  fr: { home: 'Accueil', library: 'Bibliothèque', plans: 'Offres', faq: 'FAQ', contact: 'Contact' },
  it: { home: 'Home', library: 'Biblioteca', plans: 'Piani', faq: 'FAQ', contact: 'Contatto' },
};

export default function Header({
  currentLang,
  onLangChange,
  t,
  theme,
  toggleTheme,
  user,
  onLogout,
  onOpenAuth,
  activeTab,
  setActiveTab,
  isAdminMode,
  setAdminMode,
}: HeaderProps) {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedLangInfo = languagesList.find((l) => l.code === currentLang);
  const navLabels = navTranslations[currentLang] || navTranslations.pt;

  const navItems = [
    { id: 'home', label: navLabels.home, anchor: null },
    { id: 'library', label: navLabels.library, anchor: null },
    { id: 'plans', label: navLabels.plans, anchor: null },
    { id: 'faq', label: navLabels.faq, anchor: 'faq' },
    { id: 'contact', label: navLabels.contact, anchor: 'contact' },
  ];

  const handleNavClick = (item: { id: string; anchor: string | null }) => {
    setAdminMode(false);
    setMobileMenuOpen(false);

    if (item.anchor) {
      if (activeTab !== 'home') {
        setActiveTab('home');
      }
      setTimeout(() => {
        const el = document.getElementById(item.anchor!);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    } else {
      setActiveTab(item.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 border-b bg-brand-dark text-white border-brand-medium/50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand */}
          <div
            onClick={() => {
              setActiveTab('home');
              setAdminMode(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-brand-medium text-brand-gold group-hover:scale-105 transition-transform shadow-inner border border-brand-gold/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-white group-hover:text-brand-gold transition-colors block">
                {t.brand}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-brand-gold block font-semibold leading-none">
                Editorial Digital
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === item.id && !isAdminMode
                    ? 'text-brand-gold bg-brand-medium/40 font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}

            {user?.isAdmin && (
              <button
                id="nav-admin-direct"
                type="button"
                onClick={() => {
                  setAdminMode(true);
                  setActiveTab('admin');
                }}
                className={`ml-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 border shadow-sm cursor-pointer ${
                  isAdminMode && activeTab === 'admin'
                    ? 'bg-brand-gold text-brand-dark border-brand-gold ring-2 ring-brand-gold/30'
                    : 'bg-brand-gold/15 text-brand-gold border-brand-gold/40 hover:bg-brand-gold/25'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>{t.adminPanel}</span>
              </button>
            )}
          </nav>

          {/* Controls & User Area */}
          <div className="hidden lg:flex items-center space-x-3">
            <PWAInstallButton />

            {/* Language Selector */}
            <div className="relative">
              <button
                id="lang-selector-btn"
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-brand-medium text-sm text-gray-200 hover:text-white hover:bg-brand-medium/30 transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4 text-brand-gold" />
                <span>{selectedLangInfo?.flag} {selectedLangInfo?.label}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-brand-charcoal border border-brand-medium/50 py-1.5 z-50 text-gray-200">
                  {languagesList.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onLangChange(lang.code as AppLanguage);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-brand-medium/40 hover:text-white transition-colors cursor-pointer ${
                        currentLang === lang.code ? 'text-brand-gold font-bold bg-brand-medium/20' : ''
                      }`}
                    >
                      <span>{lang.flag} {lang.label}</span>
                      {currentLang === lang.code && <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Light/Dark Toggle */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-brand-medium/40 transition-colors text-brand-gold cursor-pointer"
              title="Alternar Tema"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* User Session Buttons */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-btn"
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    user.isAdmin
                      ? 'border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20'
                      : 'border-brand-medium bg-brand-medium/30 hover:bg-brand-medium/50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    user.isAdmin ? 'bg-brand-gold text-brand-dark' : 'bg-brand-medium text-brand-gold'
                  }`}>
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-brand-charcoal border border-brand-medium/50 py-2 z-50 text-gray-200">
                    <div className="px-4 py-2 border-b border-brand-medium/30">
                      <p className="text-xs text-gray-400">Autenticado como</p>
                      <p className="text-sm font-semibold truncate text-white">{user.email}</p>
                      {user.isSubscribed && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                          {user.subscriptionPlan === 'annual' ? t.annual : t.monthly} Activa
                        </span>
                      )}
                    </div>

                    {user.isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminMode(true);
                          setActiveTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className={`flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm hover:bg-brand-medium/40 text-brand-gold transition-colors cursor-pointer ${
                          isAdminMode ? 'bg-brand-medium/30 font-semibold' : ''
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t.adminPanel}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('user');
                        setAdminMode(false);
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm hover:bg-brand-medium/40 hover:text-white transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>{t.userArea}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors border-t border-brand-medium/20 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="login-btn"
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-brand-gold text-brand-dark hover:bg-brand-gold-light transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
              >
                {t.login}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <PWAInstallButton />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-brand-medium/40 text-brand-gold"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              id="mobile-menu-btn"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-brand-medium/40 text-brand-gold transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-dark border-t border-brand-medium/40 px-4 py-4 space-y-3 animate-fade-in">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                  activeTab === item.id && !isAdminMode
                    ? 'text-brand-gold bg-brand-medium/40 font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="border-t border-brand-medium/20 pt-3">
            <p className="text-xs text-gray-400 px-4 mb-2">{t.filterLanguage}</p>
            <div className="grid grid-cols-2 gap-2 px-2">
              {languagesList.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onLangChange(lang.code as AppLanguage);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs ${
                    currentLang === lang.code
                      ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
                      : 'bg-brand-medium/20 text-gray-300 border border-transparent'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-brand-medium/20 pt-3 pb-2 px-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-2 bg-brand-medium/20 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-brand-gold text-brand-dark flex items-center justify-center font-bold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{user.email}</p>
                  </div>
                </div>

                {user.isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminMode(true);
                      setActiveTab('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2.5 rounded-lg text-sm text-brand-gold hover:bg-brand-medium/30 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t.adminPanel}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('user');
                    setAdminMode(false);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-brand-medium/30 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{t.userArea}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logout}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-brand-gold text-brand-dark hover:bg-brand-gold-light transition-colors"
              >
                {t.login}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
