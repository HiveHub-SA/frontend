import { Injectable } from '@angular/core';

export interface CachedApiario {
  id: number;
  name: string;
  latitude?: number;
  longitude?: number;
  colmenasCount?: number;
}

export interface CachedColmena {
  id: number;
  name: string;
  apiarioId?: number;
}

/**
 * Servicio encargado de la gestión de caché de datos maestros (Apiarios y Colmenas)
 * para permitir la navegación, selección y carga de inspecciones en modo offline (US 05).
 */
@Injectable({ providedIn: 'root' })
export class OfflineCacheService {
  private readonly APIARIOS_KEY = 'hivehub_cached_apiarios';
  private readonly COLMENAS_PREFIX = 'hivehub_cached_colmenas_apiario_';

  /**
   * Guarda o actualiza la lista de apiarios en la caché local.
   */
  cacheApiarios(apiarios: any[]): void {
    try {
      if (!apiarios || !Array.isArray(apiarios)) return;
      localStorage.setItem(this.APIARIOS_KEY, JSON.stringify(apiarios));
    } catch (e) {
      console.error('Error al guardar apiarios en caché offline:', e);
    }
  }

  /**
   * Obtiene la lista de apiarios almacenados en la caché local.
   */
  getCachedApiarios(): any[] {
    try {
      const raw = localStorage.getItem(this.APIARIOS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch (e) {
      console.error('Error al leer apiarios de la caché offline:', e);
      return [];
    }
  }

  /**
   * Obtiene un apiario específico desde la caché local por su ID.
   */
  getCachedApiarioById(id: number): any | null {
    const list = this.getCachedApiarios();
    return list.find(a => a.id === id || a.id === Number(id)) || null;
  }

  /**
   * Guarda o actualiza la lista de colmenas para un apiario específico.
   */
  cacheColmenas(apiarioId: number, colmenas: any[]): void {
    try {
      if (!colmenas || !Array.isArray(colmenas)) return;
      localStorage.setItem(`${this.COLMENAS_PREFIX}${apiarioId}`, JSON.stringify(colmenas));
    } catch (e) {
      console.error(`Error al guardar colmenas para apiario ${apiarioId} en caché:`, e);
    }
  }

  /**
   * Obtiene la lista de colmenas cacheadas para un apiario determinado.
   */
  getCachedColmenas(apiarioId: number): any[] {
    try {
      const raw = localStorage.getItem(`${this.COLMENAS_PREFIX}${apiarioId}`);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch (e) {
      console.error(`Error al leer colmenas para apiario ${apiarioId} de la caché:`, e);
      return [];
    }
  }
}
