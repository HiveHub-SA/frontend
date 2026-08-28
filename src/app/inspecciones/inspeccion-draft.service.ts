import { Injectable } from '@angular/core';
import { InspeccionColmenaDTO } from './inspeccion.model';

export interface InspectionDraftData {
  apiarioId: number;
  inspeccionId?: number | null;
  fecha?: string;
  floracion?: string;
  varroa?: 'NO_DETECTADA' | 'DETECTADA';
  colmenasGuardadas?: { [colmenaId: number]: InspeccionColmenaDTO };
  colmenaFormulariosEnProgreso?: { [colmenaId: number]: Partial<InspeccionColmenaDTO> };
  lastUpdated?: string;
}

/**
 * Servicio Angular para la gestión del guardado continuo local en localStorage
 * y recuperación de borradores tras cortes de energía o cierres forzosos (US 15 / US 15.1).
 */
@Injectable({ providedIn: 'root' })
export class InspeccionDraftService {
  private readonly STORAGE_PREFIX = 'hivehub_draft_apiario_';

  private getStorageKey(apiarioId: number): string {
    return `${this.STORAGE_PREFIX}${apiarioId}`;
  }

  /**
   * Obtiene el borrador almacenado localmente para un apiario.
   */
  getDraft(apiarioId: number): InspectionDraftData | null {
    try {
      const raw = localStorage.getItem(this.getStorageKey(apiarioId));
      if (!raw) return null;
      return JSON.parse(raw) as InspectionDraftData;
    } catch (e) {
      console.error('Error al leer borrador local de inspección:', e);
      return null;
    }
  }

  /**
   * Guarda o actualiza la información general del borrador para un apiario.
   */
  saveDraft(apiarioId: number, data: Partial<InspectionDraftData>): void {
    try {
      const existing = this.getDraft(apiarioId) || { apiarioId };
      const updated: InspectionDraftData = {
        ...existing,
        ...data,
        apiarioId,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.getStorageKey(apiarioId), JSON.stringify(updated));
    } catch (e) {
      console.error('Error al guardar borrador local de inspección:', e);
    }
  }

  /**
   * Guarda continuamente el borrador en progreso de una colmena individual (US 15).
   */
  saveColmenaFormProgress(apiarioId: number, colmenaId: number, form: Partial<InspeccionColmenaDTO>): void {
    try {
      const draft = this.getDraft(apiarioId) || { apiarioId };
      const formularios = draft.colmenaFormulariosEnProgreso || {};
      formularios[colmenaId] = {
        ...(formularios[colmenaId] || {}),
        ...form,
        colmenaId
      };

      draft.colmenaFormulariosEnProgreso = formularios;
      draft.lastUpdated = new Date().toISOString();

      localStorage.setItem(this.getStorageKey(apiarioId), JSON.stringify(draft));
    } catch (e) {
      console.error('Error al guardar formulario continuo de colmena:', e);
    }
  }

  /**
   * Consolida y marca una colmena como guardada en el borrador local.
   */
  saveColmenaCompletada(apiarioId: number, colmenaId: number, dto: InspeccionColmenaDTO): void {
    try {
      const draft = this.getDraft(apiarioId) || { apiarioId };
      const guardadas = draft.colmenasGuardadas || {};
      guardadas[colmenaId] = dto;

      draft.colmenasGuardadas = guardadas;

      // Limpiar el borrador en progreso de esa colmena al consolidar
      if (draft.colmenaFormulariosEnProgreso && draft.colmenaFormulariosEnProgreso[colmenaId]) {
        delete draft.colmenaFormulariosEnProgreso[colmenaId];
      }

      draft.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.getStorageKey(apiarioId), JSON.stringify(draft));
    } catch (e) {
      console.error('Error al consolidar colmena en borrador local:', e);
    }
  }

  /**
   * Obtiene el formulario en progreso o guardado localmente de una colmena.
   */
  getColmenaDraftData(apiarioId: number, colmenaId: number): Partial<InspeccionColmenaDTO> | null {
    const draft = this.getDraft(apiarioId);
    if (!draft) return null;

    // Priorizar formulario en progreso si existe
    if (draft.colmenaFormulariosEnProgreso && draft.colmenaFormulariosEnProgreso[colmenaId]) {
      return draft.colmenaFormulariosEnProgreso[colmenaId];
    }

    // Si ya está guardada en borrador
    if (draft.colmenasGuardadas && draft.colmenasGuardadas[colmenaId]) {
      return draft.colmenasGuardadas[colmenaId];
    }

    return null;
  }

  /**
   * Purga el borrador local de un apiario al finalizar la inspección.
   */
  clearDraft(apiarioId: number): void {
    try {
      localStorage.removeItem(this.getStorageKey(apiarioId));
    } catch (e) {
      console.error('Error al purgar borrador local:', e);
    }
  }
}
