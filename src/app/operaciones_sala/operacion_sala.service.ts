import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definición de interfaces para la transferencia de datos
export interface OperacionSalaRequest {
  fecha: string;
  tipoOperacion: 'INGRESO' | 'EXTRACCION';
  cantidadAlzas: number;
  kilosMiel?: number;
  apiariosIds: number[];
}

export interface OperacionSalaResponse {
  id: number;
  fecha: string;
  tipoOperacion: 'INGRESO' | 'EXTRACCION';
  cantidadAlzas: number;
  kilosMiel?: number;
  temporada: string;
  apiariosNombres?: string[];
}

export interface ResumenSalaResponse {
  totalMielExtraida: number;
  alzasProcesadas: number;
  alzasEnEspera: number;
}

export interface Apiario {
  id: number;
  name: string;
  createdAt: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class OperacionSalaService {

  // URL base del endpoint de operaciones de sala
  private readonly apiUrl = 'http://localhost:8080/api/hivehub/sala-extraccion';
  private readonly coreUrl = 'http://localhost:8080/hivehub';

  constructor(private http: HttpClient) { }

  // Registra una nueva operación en el sistema
  registrarOperacion(operacion: OperacionSalaRequest): Observable<OperacionSalaResponse> {
    return this.http.post<OperacionSalaResponse>(this.apiUrl, operacion);
  }

  // Obtiene el resumen de operaciones filtrado por temporada
  obtenerResumen(temporada: string): Observable<ResumenSalaResponse> {
    return this.http.get<ResumenSalaResponse>(`${this.apiUrl}/resumen?temporada=${temporada}`);
  }

  // Obtiene el historial de operaciones filtrado por temporada
  obtenerHistorial(temporada: string): Observable<OperacionSalaResponse[]> {
    return this.http.get<OperacionSalaResponse[]>(`${this.apiUrl}/historial?temporada=${temporada}`);
  }

  // --- API Apiarios ---
  obtenerApiarios(): Observable<Apiario[]> {
    return this.http.get<Apiario[]>(`${this.coreUrl}/apiarios`);
  }
}
