import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definición de interfaces para la transferencia de datos
export interface OperacionSalaRequest {
  fecha: string;
  tipoOperacion: 'INGRESO' | 'EXTRACCION';
  cantidadAlzas: number;
  kilosMiel?: number;
  regionId: number;
  apiariosIds: number[];
}

export interface OperacionSalaResponse {
  id: number;
  fecha: string;
  tipoOperacion: 'INGRESO' | 'EXTRACCION';
  cantidadAlzas: number;
  kilosMiel?: number;
  temporada: string;
  regionId?: number;
  regionNombre?: string;
  apiariosNombres?: string[];
}

export interface ResumenSalaResponse {
  totalMielExtraida: number;
  alzasProcesadas: number;
  alzasEnEspera: number;
}

export interface Region {
  id: number;
  nombre: string;
  inicioTemporadaMes: number; // 1-12
  finTemporadaMes: number;    // 1-12
}

export interface Apiario {
  id: number;
  name: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  regionId: number;
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

  // Obtiene el resumen de operaciones filtrado por región y temporada
  obtenerResumen(regionId: number, temporada: string): Observable<ResumenSalaResponse> {
    return this.http.get<ResumenSalaResponse>(`${this.apiUrl}/resumen?regionId=${regionId}&temporada=${temporada}`);
  }

  // Obtiene el historial de operaciones filtrado por región y temporada
  obtenerHistorial(regionId: number, temporada: string): Observable<OperacionSalaResponse[]> {
    return this.http.get<OperacionSalaResponse[]>(`${this.apiUrl}/historial?regionId=${regionId}&temporada=${temporada}`);
  }

  // --- API Regiones ---
  obtenerRegiones(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.coreUrl}/regiones`);
  }

  crearRegion(region: Partial<Region>): Observable<Region> {
    return this.http.post<Region>(`${this.coreUrl}/regiones`, region);
  }

  actualizarRegion(id: number, region: Partial<Region>): Observable<Region> {
    return this.http.put<Region>(`${this.coreUrl}/regiones/${id}`, region);
  }

  // --- API Apiarios ---
  obtenerApiarios(): Observable<Apiario[]> {
    return this.http.get<Apiario[]>(`${this.coreUrl}/apiarios`);
  }
}
