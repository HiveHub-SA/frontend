import { Injectable } from '@angular/core';
import { AudioRecord } from '../models/audio-record.model';

const DB_NAME = 'hivehub-audio-db';
const DB_VERSION = 1;
const STORE_NAME = 'audio-records';

/**
 * Acceso a IndexedDB para audios grabados offline.
 *
 * Nota sobre almacenamiento persistente y cuota disponible:
 * - La API de StorageManager (navigator.storage) permite pedir persistencia
 *   y estimar el uso/cuota disponible. No todos los navegadores la soportan.
 * - Chrome y Firefox permiten persistencia explícita, pero no Safari.
 * - iOS Safari no soporta StorageManager, pero sí IndexedDB. Sin embargo,
 * - iOS Safari puede evictar IndexedDB bajo presión de espacio sin aviso.
 *   Por eso exponemos `requestPersistentStorage()` y `estimateStorage()`
 *   para que el componente pueda pedir persistencia y advertir al usuario
 *   si la cuota disponible es baja.
 * - No se implementa aca una política de expiración automática: queda
 *   como tarea pendiente para cuando se integre con inspecciones reales
 */
@Injectable({ providedIn: 'root' })
export class IndexedDbAudioService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  async addAudio(record: Omit<AudioRecord, 'id'>): Promise<number> {
    const db = await this.getDb();
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(record);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAudios(): Promise<AudioRecord[]> {
    const db = await this.getDb();
    return new Promise<AudioRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as AudioRecord[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateAudio(record: AudioRecord): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAudio(id: number): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Intenta obtener almacenamiento persistente (no evictable bajo presion).
   * No soportado en todos los navegadores; devuelve false si no aplica.
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage?.persist) {
      return navigator.storage.persist();
    }
    return false;
  }

  /**
   * Estimación de uso/cuota disponible, en bytes. Para avisar al
   * usuario si se está quedando sin espacio antes de que IndexedDB falle.
   */
  async estimateStorage(): Promise<{ usageBytes: number; quotaBytes: number } | null> {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return { usageBytes: estimate.usage ?? 0, quotaBytes: estimate.quota ?? 0 };
    }
    return null;
  }
}
