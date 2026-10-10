export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  language: string; // 'pt' | 'en' | 'de' | 'es' | 'fr' | 'it'
  pages: number;
  description: string;
  coverUrl: string;
  pdfUrl?: string;
  epubUrl?: string;
  pdfData?: string; // Data URL or text content of uploaded PDF/file
  epubData?: string; // Data URL or text content of uploaded EPUB/file
  pdfName?: string;
  epubName?: string;
  isFeatured: boolean;
  content: string[]; // List of chapters or pages for reading
  publishedYear: number;
}

export interface UserProfile {
  email: string;
  name: string;
  isAdmin: boolean;
  isSubscribed: boolean;
  subscriptionPlan?: 'monthly' | 'annual';
  subscriptionRenewal?: string;
  favorites: string[]; // book ids
  readingHistory: {
    bookId: string;
    lastRead: string;
    progress: number; // percentage
    currentPage: number;
  }[];
  downloads: string[]; // book ids
}

export interface SystemStats {
  totalUsers: number;
  totalSubscribers: number;
  monthlyRevenue: number;
  annualRevenue: number;
  categoryDistribution: { name: string; value: number }[];
  revenueHistory: { month: string; amount: number }[];
}

export type AppLanguage = 'pt' | 'en' | 'de' | 'es' | 'fr' | 'it';

export interface TranslationSet {
  brand: string;
  tagline: string;
  heroSub: string;
  getStarted: string;
  subscribeNow: string;
  locked: string;
  subscribeToUnlock: string;
  viewDetails: string;
  searchPlaceholder: string;
  filterLanguage: string;
  allCategories: string;
  allLanguages: string;
  monthly: string;
  annual: string;
  bestValue: string;
  subscribeButton: string;
  paymentStripe: string;
  paymentPaypal: string;
  paymentApplePay: string;
  paymentGooglePay: string;
  paymentSuccess: string;
  userArea: string;
  adminPanel: string;
  favorites: string;
  readingHistory: string;
  downloads: string;
  changePassword: string;
  cancelSubscription: string;
  continueReading: string;
  recommendations: string;
  newsletter: string;
  newsletterSub: string;
  newsletterSuccess: string;
  contact: string;
  faq: string;
  privacyPolicy: string;
  termsConditions: string;
  logout: string;
  login: string;
  register: string;
  author: string;
  category: string;
  pages: string;
  language: string;
  pagesAbbrev: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  addBook: string;
  statistics: string;
  totalRevenue: string;
  subscribers: string;
  users: string;
}
