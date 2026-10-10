// IndexedDB Helper for Caseiro Editora persistent storage

const DB_NAME = 'CaseiroEditoraDB';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';
const FILES_STORE = 'files';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBooksToIndexedDB(books: any[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(BOOKS_STORE, 'readwrite');
    const store = tx.objectStore(BOOKS_STORE);

    // Clear existing and add all current books
    store.clear();
    for (const book of books) {
      store.put(book);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Erro ao guardar no IndexedDB:', e);
  }
}

export async function loadBooksFromIndexedDB(): Promise<any[] | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(BOOKS_STORE, 'readonly');
    const store = tx.objectStore(BOOKS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result;
        if (result && Array.isArray(result) && result.length > 0) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Erro ao carregar do IndexedDB:', e);
    return null;
  }
}

export async function saveFileToIndexedDB(key: string, dataUrlOrBlob: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(FILES_STORE, 'readwrite');
    const store = tx.objectStore(FILES_STORE);
    store.put(dataUrlOrBlob, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Erro ao guardar ficheiro no IndexedDB:', e);
  }
}

export async function getFileFromIndexedDB(key: string): Promise<string | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(FILES_STORE, 'readonly');
    const store = tx.objectStore(FILES_STORE);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Erro ao obter ficheiro do IndexedDB:', e);
    return null;
  }
}
