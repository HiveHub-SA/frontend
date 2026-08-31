/**
 * DTO que representa un registro de Inspección de Apiario en el Frontend (US 35 / US 32).
 */
export interface InspeccionDTO {
  id?: number;
  fecha: string;
  floracion: string;
  varroa?: 'NO_DETECTADA' | 'DETECTADA';
  estado: 'EN_BORRADOR' | 'SINCRONIZADA';
  apiarioId: number;
}

/**
 * DTO que representa el detalle de inspección individual por colmena (US 32).
 */
export interface InspeccionColmenaDTO {
  id?: number;
  inspeccionId: number;
  colmenaId: number;
  colmenaName?: string;
  estadoReina: 'VISTA_Y_SANA' | 'NO_VISTA' | 'CELDA_REAL' | 'AUSENTE';
  nivelAlimento: 'BAJO' | 'MEDIO' | 'ALTO';
  produjoMiel: boolean;
  observaciones?: string;
}

/**
 * Modelo para representar el estado de inspección de cada colmena individual
 * dentro del listado de la pantalla "Nueva Inspección".
 */
export interface ColmenaEstadoInspeccion {
  id: number;
  name: string;
  completada: boolean;
  estadoTexto: '✓ Inspección guardada' | 'Pendiente de revisión';
}

/**
 * Variedades de floraciones predominantes disponibles en la aplicación (US 35).
 */
export type TipoFloracion =
  | 'Girasol'
  | 'Eucalipto'
  | 'Trébol'
  | 'Alfalfa'
  | 'Citrus'
  | 'Monte Nativo'
  | 'Multifloral';

/**
 * Opciones elegibles para el selector/modal de floración predominante.
 */
export const OPCIONES_FLORACION: TipoFloracion[] = [
  'Girasol',
  'Eucalipto',
  'Trébol',
  'Alfalfa',
  'Citrus',
  'Monte Nativo',
  'Multifloral'
];
