import { InventarioResponseDTO, TamanoAlza } from "../inventario/inventario.model";

export interface ColmenaDTO {
  id: number;
  name: string;
  createdAt: string;
  apiarioId: number;
  tamanoAlza?: TamanoAlza | null;
  inventarios: InventarioResponseDTO[];
}

export interface ColmenaRequestDTO {
  name: string;
  apiarioId: number;
  inventarioIds: number[];
}