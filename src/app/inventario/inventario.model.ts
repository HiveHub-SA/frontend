export type TipoInventarioNombre = 'CAMARA' | 'ALZA' | 'NUCLEO';

export const TIPO_INVENTARIO_LABELS: Record<TipoInventarioNombre, string> = {
  CAMARA: 'Cámara',
  ALZA: 'Alza',
  NUCLEO: 'Núcleo',
};

export const MARCOS_VALIDOS = [8, 9, 10] as const;

export interface InventarioRequestDTO {
  tipoInventario: TipoInventarioNombre;
  cantidadMarcos?: number | null;
  pesoInventario?: number | null;
}

export interface InventarioResponseDTO {
  id: number;
  pesoInventario: number | null;
  tipoNombre: TipoInventarioNombre;
  cantidadMarcos: number | null;
  colmenaId: number | null;
}