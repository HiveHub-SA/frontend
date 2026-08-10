import { ApiarioDTO } from "../apiarios/apiario.model";

export interface RutaDTO {
    ruta: ApiarioDTO[];
    distanciaTotalKm: number;
    totalApiarios: number;
}

export interface RutaRequestDTO {
    apiarioInicioId: number;
    apiariosDestinoIds: number[];
}