import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Book, ContactMessage, NewsletterSubscriber, UserProfile } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_EMAIL = 'smaccaseiro@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      displayName?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function toSafeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function sanitizeBookPayload(book: Book) {
  const safeId = toSafeId(book.id || String(Date.now()));
  const validLangs = ['pt', 'en', 'de', 'es', 'fr', 'it'];
  const lang = validLangs.includes(book.language) ? book.language : 'pt';
  const coverUrl =
    book.coverUrl && book.coverUrl.length <= 200000
      ? book.coverUrl
      : '/default-cover.jpg';
  const chapters = (Array.isArray(book.content) ? book.content : [])
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .slice(0, 200)
    .map((c) => c.slice(0, 4000));

  const payload: Record<string, unknown> = {
    id: safeId,
    title: (book.title || 'Sem título').trim().slice(0, 200),
    author: (book.author || 'Caseiro Editora').trim().slice(0, 150),
    category: (book.category || 'Geral').trim().slice(0, 80),
    language: lang,
    pages: Math.min(20000, Math.max(1, Number(book.pages) || 1)),
    publishedYear: Math.min(2100, Math.max(1450, Number(book.publishedYear) || new Date().getFullYear())),
    description: (book.description || '').slice(0, 3000),
    coverUrl,
    isFeatured: Boolean(book.isFeatured),
    content: chapters,
    updatedAt: serverTimestamp(),
  };

  if (book.pdfUrl && !book.pdfUrl.startsWith('data:')) {
    payload.pdfUrl = book.pdfUrl.slice(0, 1000);
  }
  if (book.epubUrl && !book.epubUrl.startsWith('data:')) {
    payload.epubUrl = book.epubUrl.slice(0, 1000);
  }
  if (book.pdfName) {
    payload.pdfName = book.pdfName.slice(0, 255);
  }
  if (book.epubName) {
    payload.epubName = book.epubName.slice(0, 255);
  }

  return { safeId, payload };
}

export async function fetchBooksFromFirestore(): Promise<Book[]> {
  const path = 'books';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        title: String(data.title || ''),
        author: String(data.author || ''),
        category: String(data.category || ''),
        language: String(data.language || 'pt'),
        pages: Number(data.pages || 1),
        publishedYear: Number(data.publishedYear || new Date().getFullYear()),
        description: String(data.description || ''),
        coverUrl: String(data.coverUrl || '/default-cover.jpg'),
        pdfUrl: data.pdfUrl ? String(data.pdfUrl) : undefined,
        epubUrl: data.epubUrl ? String(data.epubUrl) : undefined,
        pdfName: data.pdfName ? String(data.pdfName) : undefined,
        epubName: data.epubName ? String(data.epubName) : undefined,
        isFeatured: Boolean(data.isFeatured),
        content: Array.isArray(data.content) ? data.content.map(String) : [],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function syncBookToFirestore(book: Book): Promise<void> {
  const { safeId, payload } = sanitizeBookPayload(book);
  const path = `books/${safeId}`;
  try {
    await setDoc(doc(db, 'books', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBookFromFirestore(bookId: string): Promise<void> {
  const safeId = toSafeId(bookId);
  const path = `books/${safeId}`;
  try {
    await deleteDoc(doc(db, 'books', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchCategoriesFromFirestore(): Promise<string[]> {
  const path = 'categories';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => String(d.data().name || '')).filter(Boolean);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function syncCategoryToFirestore(categoryName: string): Promise<void> {
  const catId = `cat_${toSafeId(categoryName.toLowerCase())}`;
  const path = `categories/${catId}`;
  try {
    await setDoc(doc(db, 'categories', catId), {
      name: categoryName.trim().slice(0, 80),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCategoryFromFirestore(categoryName: string): Promise<void> {
  const catId = `cat_${toSafeId(categoryName.toLowerCase())}`;
  const path = `categories/${catId}`;
  try {
    await deleteDoc(doc(db, 'categories', catId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function ensureAdminDocInFirestore(uid: string, email: string): Promise<void> {
  if (email.toLowerCase() !== ADMIN_EMAIL) return;
  const safeUid = toSafeId(uid);
  const path = `admins/${safeUid}`;
  try {
    const existingSnap = await getDoc(doc(db, 'admins', safeUid));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'admins', safeUid), {
        uid: safeUid,
        email: email.toLowerCase(),
        grantedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  const safeUid = toSafeId(uid);
  const path = `users/${safeUid}`;
  try {
    const snap = await getDoc(doc(db, 'users', safeUid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: String(data.uid || safeUid),
      email: String(data.email || ''),
      name: String(data.name || ''),
      isAdmin: Boolean(data.isAdmin),
      isSubscribed: Boolean(data.isSubscribed),
      subscriptionPlan:
        data.subscriptionPlan === 'monthly' || data.subscriptionPlan === 'annual'
          ? data.subscriptionPlan
          : undefined,
      subscriptionRenewal: data.subscriptionRenewal ? String(data.subscriptionRenewal) : undefined,
      stripeSessionId: data.stripeSessionId ? String(data.stripeSessionId) : undefined,
      favorites: Array.isArray(data.favorites) ? data.favorites.map(String) : [],
      readingHistory: Array.isArray(data.readingHistory) ? data.readingHistory : [],
      downloads: Array.isArray(data.downloads) ? data.downloads.map(String) : [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createOrUpdateUserProfileInFirestore(
  uid: string,
  profile: UserProfile,
  isNew: boolean
): Promise<void> {
  const safeUid = toSafeId(uid);
  const path = `users/${safeUid}`;
  const isBootstrappedAdmin = profile.email.toLowerCase() === ADMIN_EMAIL;

  const payload: Record<string, unknown> = {
    uid: safeUid,
    email: profile.email.toLowerCase().slice(0, 254),
    name: (profile.name || 'Leitor').trim().slice(0, 120),
    isAdmin: isBootstrappedAdmin ? true : false,
    isSubscribed: Boolean(profile.isSubscribed),
    favorites: (profile.favorites || []).slice(0, 500),
    readingHistory: (profile.readingHistory || []).slice(0, 500),
    downloads: (profile.downloads || []).slice(0, 500),
    updatedAt: serverTimestamp(),
  };

  if (profile.subscriptionPlan) {
    payload.subscriptionPlan = profile.subscriptionPlan;
  } else {
    payload.subscriptionPlan = 'none';
  }
  if (profile.subscriptionRenewal) {
    payload.subscriptionRenewal = profile.subscriptionRenewal.slice(0, 32);
  }
  if (profile.stripeSessionId) {
    payload.stripeSessionId = profile.stripeSessionId.slice(0, 200);
  }

  try {
    if (isNew) {
      await setDoc(doc(db, 'users', safeUid), payload);
    } else {
      await setDoc(doc(db, 'users', safeUid), payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserReadingStateInFirestore(
  uid: string,
  updates: Pick<UserProfile, 'favorites' | 'readingHistory' | 'downloads'>
): Promise<void> {
  const safeUid = toSafeId(uid);
  const path = `users/${safeUid}`;
  try {
    await updateDoc(doc(db, 'users', safeUid), {
      favorites: updates.favorites.slice(0, 500),
      readingHistory: updates.readingHistory.slice(0, 500),
      downloads: updates.downloads.slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserSubscriptionInFirestore(
  uid: string,
  subData: {
    isSubscribed: boolean;
    subscriptionPlan?: 'monthly' | 'annual';
    subscriptionRenewal?: string;
    stripeSessionId?: string;
  }
): Promise<void> {
  const safeUid = toSafeId(uid);
  const path = `users/${safeUid}`;
  try {
    const updatePayload: Record<string, unknown> = {
      isSubscribed: subData.isSubscribed,
      subscriptionPlan: subData.subscriptionPlan || 'none',
      subscriptionRenewal: subData.subscriptionRenewal || '',
      updatedAt: serverTimestamp(),
    };
    if (subData.stripeSessionId) {
      updatePayload.stripeSessionId = subData.stripeSessionId.slice(0, 200);
    }
    await updateDoc(doc(db, 'users', safeUid), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchAllUsersForAdmin(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: String(data.uid || d.id),
        email: String(data.email || ''),
        name: String(data.name || ''),
        isAdmin: Boolean(data.isAdmin),
        isSubscribed: Boolean(data.isSubscribed),
        subscriptionPlan:
          data.subscriptionPlan === 'monthly' || data.subscriptionPlan === 'annual'
            ? data.subscriptionPlan
            : undefined,
        subscriptionRenewal: data.subscriptionRenewal ? String(data.subscriptionRenewal) : undefined,
        favorites: Array.isArray(data.favorites) ? data.favorites.map(String) : [],
        readingHistory: Array.isArray(data.readingHistory) ? data.readingHistory : [],
        downloads: Array.isArray(data.downloads) ? data.downloads.map(String) : [],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function submitContactMessageToFirestore(
  name: string,
  email: string,
  message: string
): Promise<string> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `contactMessages/${messageId}`;
  try {
    await setDoc(doc(db, 'contactMessages', messageId), {
      name: name.trim().slice(0, 120),
      email: email.trim().toLowerCase().slice(0, 254),
      message: message.trim().slice(0, 2000),
      status: 'new',
      createdAt: serverTimestamp(),
    });
    return messageId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function subscribeNewsletterInFirestore(
  email: string,
  language: string
): Promise<string> {
  const safeEmailSlug = toSafeId(email.trim().toLowerCase()).slice(0, 100);
  const subscriberId = `sub_${Date.now()}_${safeEmailSlug.slice(0, 20)}`;
  const validLangs = ['pt', 'en', 'de', 'es', 'fr', 'it'];
  const lang = validLangs.includes(language) ? language : 'pt';
  const path = `newsletterSubscribers/${subscriberId}`;
  try {
    await setDoc(doc(db, 'newsletterSubscribers', subscriberId), {
      email: email.trim().toLowerCase().slice(0, 254),
      language: lang,
      createdAt: serverTimestamp(),
    });
    return subscriberId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchContactMessagesForAdmin(): Promise<ContactMessage[]> {
  const path = 'contactMessages';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const created = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      return {
        id: d.id,
        name: String(data.name || ''),
        email: String(data.email || ''),
        message: String(data.message || ''),
        status: (data.status === 'read' || data.status === 'replied' ? data.status : 'new'),
        createdAt: created,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateContactMessageStatusInFirestore(
  messageId: string,
  status: 'new' | 'read' | 'replied'
): Promise<void> {
  const safeId = toSafeId(messageId);
  const path = `contactMessages/${safeId}`;
  try {
    await updateDoc(doc(db, 'contactMessages', safeId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessageInFirestore(messageId: string): Promise<void> {
  const safeId = toSafeId(messageId);
  const path = `contactMessages/${safeId}`;
  try {
    await deleteDoc(doc(db, 'contactMessages', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchNewsletterSubscribersForAdmin(): Promise<NewsletterSubscriber[]> {
  const path = 'newsletterSubscribers';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const created = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      return {
        id: d.id,
        email: String(data.email || ''),
        language: String(data.language || 'pt'),
        createdAt: created,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteNewsletterSubscriberInFirestore(subscriberId: string): Promise<void> {
  const safeId = toSafeId(subscriberId);
  const path = `newsletterSubscribers/${safeId}`;
  try {
    await deleteDoc(doc(db, 'newsletterSubscribers', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
