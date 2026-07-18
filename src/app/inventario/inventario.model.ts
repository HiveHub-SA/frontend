export interface InventarioRequestDTO {
  tipoInventario: string;         // "Colmena", "Alza", "Núcleo"
  cantidadMarcos?: number | null; // 8, 9, 10 para Alza; null para otros
  pesoInventario?: number | null;
  colmenaId?: number | null;      // opcional: asocia el material a una colmena existente
}

export interface Inventario {
  id: number;
  pesoInventario: number | null;
  tipoInventario: TipoDeInventario;
}

export interface TipoDeInventario {
  id: number;
  nombre: string;
  cantidadMarcos: number | null;
}

export interface InventarioResponseDTO {
  id: number;
  pesoInventario: number | null;
  tipoNombre: string;
  cantidadMarcos: number | null;
  colmenaId: number | null;
}