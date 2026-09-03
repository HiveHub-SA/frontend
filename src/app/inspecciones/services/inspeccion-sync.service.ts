import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NetworkStatusService } from '../../shared/services/network-status.service';
import { InspeccionDTO, InspeccionColmenaDTO } from '../inspeccion.model';

export interface InspeccionOfflineQueueItem {
  id?: number;
  uuid: string;
  apiarioId: number;
  apiarioNombre?: string;
  fecha: string;
  floracion: string;
  varroa?: 'NO_DETECTADA' | 'DETECTADA';
  estado: 'EN_BORRADOR' | 'SINCRONIZADA';
  colmenas: InspeccionColmenaDTO[];
  estadoSync: 'PENDIENTE' | 'SINCRONIZANDO' | 'ERROR';
  creadoEn: string;
  errorMsg?: string;
}

/**
 * Servicio encargado de gestionar la Cola de Sincronización Offline de Inspecciones (US 05).
 * Permite encolar inspecciones con identificador único universal (UUID v4),
 * persistir localmente y sincronizar automáticamente o bajo demanda cuando hay red.
 */
@Injectable({ providedIn: 'root' })
export class InspeccionSyncService {
  private readonly QUEUE_KEY = 'hivehub_offline_inspections_queue';
  private readonly apiUrl = 'http://localhost:8080/hivehub';

  private http = inject(HttpClient);
  private networkStatus = inject(NetworkStatusService);

  readonly pendingCount = signal<number>(0);
  readonly isSyncing = signal<boolean>(false);

  constructor() {
    this.updatePendingCount();

    // Auto-sincronización reactiva cuando la conexión vuelve a estar online
    effect(() => {
      const isOnline = this.networkStatus.online();
      if (isOnline && this.pendingCount() > 0 && !this.isSyncing()) {
        console.info('[InspeccionSyncService] Conexión online detectada. Iniciando sincronización de cola pendiente.');
        this.syncAllPending();
      }
    });
  }

  /**
   * Genera un identificador universal UUID v4 compatible con todos los navegadores.
   */
  generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Obtiene la cola completa de inspecciones offline desde el almacenamiento local.
   */
  getPendingQueue(): InspeccionOfflineQueueItem[] {
    try {
      const raw = localStorage.getItem(this.QUEUE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch (e) {
      console.error('[InspeccionSyncService] Error al parsear cola offline:', e);
      return [];
    }
  }

  /**
   * Guarda la cola completa de inspecciones en el almacenamiento local.
   */
  private saveQueue(queue: InspeccionOfflineQueueItem[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      this.updatePendingCount();
    } catch (e) {
      console.error('[InspeccionSyncService] Error al persistir cola offline en localStorage:', e);
    }
  }

  /**
   * Actualiza el signal de cantidad de inspecciones pendientes.
   */
  private updatePendingCount(): void {
    const queue = this.getPendingQueue();
    const count = queue.filter(item => item.estadoSync !== 'SINCRONIZANDO').length;
    this.pendingCount.set(count);
  }

  /**
   * Encola una nueva inspección completa generada en modo offline.
   * Asigna un UUID v4 único y estado inicial 'PENDIENTE'.
   */
  enqueueInspeccion(data: {
    id?: number;
    apiarioId: number;
    apiarioNombre?: string;
    fecha?: string;
    floracion?: string;
    varroa?: 'NO_DETECTADA' | 'DETECTADA';
    colmenas?: InspeccionColmenaDTO[];
  }): string {
    const uuid = this.generateUUID();
    const queue = this.getPendingQueue();

    const newItem: InspeccionOfflineQueueItem = {
      id: data.id,
      uuid,
      apiarioId: data.apiarioId,
      apiarioNombre: data.apiarioNombre || 'Apiario #' + data.apiarioId,
      fecha: data.fecha || new Date().toISOString(),
      floracion: data.floracion || 'Girasol',
      varroa: data.varroa || 'NO_DETECTADA',
      estado: 'SINCRONIZADA',
      colmenas: data.colmenas || [],
      estadoSync: 'PENDIENTE',
      creadoEn: new Date().toISOString()
    };

    queue.push(newItem);
    this.saveQueue(queue);
    console.info(`[InspeccionSyncService] Inspección encolada: uuid=${uuid}, apiarioId=${data.apiarioId}, colmenas=${newItem.colmenas.length}`);
    return uuid;
  }

  /**
   * Sincroniza todas las inspecciones pendientes con el backend.
   */
  async syncAllPending(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing()) return { success: 0, failed: 0 };
    if (!this.networkStatus.online()) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing.set(true);
    const queue = this.getPendingQueue();
    let successCount = 0;
    let failedCount = 0;

    const remainingQueue: InspeccionOfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        item.estadoSync = 'SINCRONIZANDO';

        const payload: InspeccionDTO = {
          id: item.id && item.id > 0 ? item.id : undefined,
          apiarioId: item.apiarioId,
          fecha: item.fecha,
          floracion: item.floracion,
          varroa: item.varroa,
          estado: 'SINCRONIZADA',
          uuidLocal: item.uuid,
          colmenas: item.colmenas
        };

        const res = await firstValueFrom(
          this.http.post<InspeccionDTO>(`${this.apiUrl}/inspecciones/sincronizar`, payload)
        );

        if (res && (res.id || res.uuidLocal)) {
          successCount++;
          console.info(`[InspeccionSyncService] Sincronización exitosa: uuid=${item.uuid}, remoteId=${res.id}`);
        } else {
          item.estadoSync = 'ERROR';
          item.errorMsg = 'Respuesta inesperada del servidor';
          failedCount++;
          remainingQueue.push(item);
        }
      } catch (err: any) {
        console.error(`[InspeccionSyncService] Error al sincronizar uuid=${item.uuid}:`, err);
        item.estadoSync = 'ERROR';
        item.errorMsg = err.message || 'Error de red';
        failedCount++;
        remainingQueue.push(item);
      }
    }

    this.saveQueue(remainingQueue);
    this.isSyncing.set(false);
    return { success: successCount, failed: failedCount };
  }

  /**
   * Elimina un registro de la cola local manualmente si es necesario.
   */
  deleteQueued(uuid: string): void {
    const queue = this.getPendingQueue().filter(i => i.uuid !== uuid);
    this.saveQueue(queue);
  }
}
