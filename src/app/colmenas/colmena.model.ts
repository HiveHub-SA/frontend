import { InventarioResponseDTO } from "../inventario/inventario.model";

export interface ColmenaDTO {
  id: number;
  name: string;
  createdAt: string;
  apiarioId: number;
  inventarios: InventarioResponseDTO[];
}

export interface ColmenaRequestDTO {
  name: string;
  apiarioId: number;
  inventarioIds: number[];
}