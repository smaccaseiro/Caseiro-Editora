import { useState } from 'react';
import { BookOpen, Globe, Moon, Sun, User, Settings, LogOut, Menu, X, Star } from 'lucide-react';
import { AppLanguage, UserProfile, TranslationSet } from '../types';

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

  const navItems = [
    { id: 'home', label: currentLang === 'pt' ? 'Início' : currentLang === 'en' ? 'Home' : 'Startseite' },
    { id: 'library', label: currentLang === 'pt' ? 'Biblioteca' : currentLang === 'en' ? 'Library' : 'Bibliothek' },
    { id: 'plans', label: currentLang === 'pt' ? 'Planos' : currentLang === 'en' ? 'Plans' : 'Pläne' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: currentLang === 'pt' ? 'Contacto' : currentLang === 'en' ? 'Contact' : 'Kontakt' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 border-b bg-brand-dark text-white border-brand-medium/50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div 
            onClick={() => { setActiveTab('home'); setAdminMode(false); }}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-brand-medium text-brand-gold group-hover:scale-105 transition-transform shadow-inner border border-brand-gold/20">
              <BookOpen className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-white group-hover:text-brand-gold transition-colors block">
                {t.brand}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-brand-gold block font-semibold leading-none">
                Premium Library
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setAdminMode(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                onClick={() => {
                  setAdminMode(true);
                  setActiveTab('admin');
                }}
                className={`ml-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-1.5 border shadow-sm ${
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
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                id="lang-selector-btn"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-brand-medium text-sm text-gray-200 hover:text-white hover:bg-brand-medium/30 transition-all"
              >
                <Globe className="w-4 h-4 text-brand-gold" />
                <span>{selectedLangInfo?.flag} {selectedLangInfo?.label}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-brand-charcoal border border-brand-medium/50 py-1.5 z-50 text-gray-200">
                  {languagesList.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLangChange(lang.code as AppLanguage);
                        setLangDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-brand-medium/40 hover:text-white transition-colors ${
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
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-brand-medium/40 transition-colors text-brand-gold"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* User Session Buttons */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
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
                      <p className="text-xs text-gray-400">Logado como</p>
                      <p className="text-sm font-semibold truncate text-white">{user.email}</p>
                      {user.isSubscribed && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                          {user.subscriptionPlan === 'annual' ? t.annual : t.monthly} Activa
                        </span>
                      )}
                    </div>

                    {user.isAdmin && (
                      <button
                        onClick={() => {
                          setAdminMode(true);
                          setActiveTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className={`flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm hover:bg-brand-medium/40 text-brand-gold transition-colors ${
                          isAdminMode ? 'bg-brand-medium/30 font-semibold' : ''
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t.adminPanel}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab('user');
                        setAdminMode(false);
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm hover:bg-brand-medium/40 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>{t.userArea}</span>
                    </button>

                    <button
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors border-t border-brand-medium/20"
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
                onClick={onOpenAuth}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-brand-gold text-brand-dark hover:bg-brand-gold-light transition-all shadow-md transform hover:-translate-y-0.5"
              >
                {t.login}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-brand-medium/40 text-brand-gold"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              id="mobile-menu-btn"
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
          {/* Navigation Items */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setAdminMode(false);
                  setMobileMenuOpen(false);
                }}
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

          {/* Mobile Lang Selector */}
          <div className="border-t border-brand-medium/20 pt-3">
            <p className="text-xs text-gray-400 px-4 mb-2">{t.filterLanguage}</p>
            <div className="grid grid-cols-2 gap-2 px-2">
              {languagesList.map((lang) => (
                <button
                  key={lang.code}
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

          {/* Session controls */}
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
