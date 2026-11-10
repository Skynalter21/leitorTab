// Concrete IndexedDB Repository implementing ITablatureRepository (SRP, LSP, DIP)

import type { ITablatureRepository } from '../domain/contracts';
import type {
  LibraryItem,
  SavedSongSettings,
  StudyStatus,
} from '../domain/models';

export type { LibraryItem, SavedSongSettings, StudyStatus };

const DB_NAME = 'LeitorTabStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'tablatures';

export class IndexedDbTablatureRepository implements ITablatureRepository {
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('lastOpenedAt', 'lastOpenedAt', { unique: false });
          store.createIndex('fileName', 'fileName', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<LibraryItem[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result as LibraryItem[]) || [];
        items.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async save(item: LibraryItem): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async updateMeta(
    id: string,
    patch: Partial<Omit<LibraryItem, 'id' | 'data'>>
  ): Promise<LibraryItem | null> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as LibraryItem | undefined;
        if (!existing) {
          resolve(null);
          return;
        }
        const updated: LibraryItem = {
          ...existing,
          ...patch,
          settings: patch.settings
            ? { ...(existing.settings || {}), ...patch.settings }
            : existing.settings,
        };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const defaultTablatureRepository: ITablatureRepository =
  new IndexedDbTablatureRepository();

// Facade functions delegating to the repository instance
export const getAllLibraryItems = () => defaultTablatureRepository.getAll();
export const saveLibraryItem = (item: LibraryItem) =>
  defaultTablatureRepository.save(item);
export const updateLibraryItemMeta = (
  id: string,
  patch: Partial<Omit<LibraryItem, 'id' | 'data'>>
) => defaultTablatureRepository.updateMeta(id, patch);
export const deleteLibraryItem = (id: string) =>
  defaultTablatureRepository.delete(id);
