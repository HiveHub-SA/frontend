/**
 * DTO que representa un registro de Inspección de Apiario en el Frontend (US 35 / US 32).
 */
export interface InspeccionDTO {
  id?: number;
  fecha: string;
  floracion: string;
  estado: 'EN_BORRADOR' | 'SINCRONIZADA';
  apiarioId: number;
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
